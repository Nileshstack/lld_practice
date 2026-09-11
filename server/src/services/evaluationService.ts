import OpenAI from 'openai';
import database from '../db/db';
import { CriterionResult, Evaluation } from '../models/evaluation';
import { Attempt, SubmissionType } from '../models/attempt';
import { Problem } from '../models/problem';

const minimumSubmissionLength = 20;
const criteria = [
  'Requirement Understanding',
  'Class Responsibilities',
  'Coupling/Cohesion',
  'Extensibility',
  'Edge Cases'
] as const;
const failedEvaluationMessage = 'Evaluation failed. Please try again later.';

interface AiEvaluationResponse {
  overallScore: number;
  criteria: CriterionResult[];
}

export class EvaluationServiceError extends Error {
  constructor(public readonly statusCode: 400 | 404 | 500, message: string) {
    super(message);
  }
}

function updateAttemptStatus(attemptId: number, status: Attempt['status'], errorMessage: string | null = null): void {
  database.prepare(`
    UPDATE attempts
    SET status = ?, error_message = ?
    WHERE id = ?
  `).run(status, errorMessage, attemptId);
}

function requiredConcepts(tags: string[]): string[] {
  return tags.flatMap((tag) => {
    const normalized = tag.toLowerCase().replace(/[-_]/g, ' ').trim();
    return normalized ? [normalized, tag.toLowerCase()] : [];
  });
}

function runDeterministicChecks(attempt: Attempt, problem: Problem): string[] {
  const submission = attempt.submissionText.trim();
  const failures: string[] = [];

  if (submission.length < minimumSubmissionLength) {
    failures.push(`Submission must contain at least ${minimumSubmissionLength} characters.`);
  }

  const concepts = requiredConcepts(problem.tags);
  const mentionedConcepts = concepts.filter((concept, index) => concepts.indexOf(concept) === index && submission.toLowerCase().includes(concept));
  if (concepts.length > 0 && mentionedConcepts.length === 0) {
    failures.push(`Submission must mention at least one required concept: ${problem.tags.join(', ')}.`);
  }

  return failures;
}

function parseAiResponse(content: string): AiEvaluationResponse {
  const parsed = JSON.parse(content) as Partial<AiEvaluationResponse>;
  if (typeof parsed.overallScore !== 'number' || parsed.overallScore < 0 || parsed.overallScore > 100 || !Array.isArray(parsed.criteria)) {
    throw new Error('OpenAI returned an invalid evaluation shape');
  }

  const normalizedCriteria = criteria.map((criterion) => {
    const result = parsed.criteria!.find((item) => item?.criterion === criterion);
    if (!result || typeof result.score !== 'number' || typeof result.evidence !== 'string' || typeof result.suggestion !== 'string') {
      throw new Error(`OpenAI response is missing criterion: ${criterion}`);
    }
    return {
      criterion,
      score: Math.max(0, Math.min(100, result.score)),
      evidence: result.evidence,
      suggestion: result.suggestion
    };
  });

  return { overallScore: parsed.overallScore, criteria: normalizedCriteria };
}

export async function evaluateAttempt(attempt: Attempt, problem: Problem): Promise<Evaluation> {
  const attemptId = attempt.id;
  try {
    const deterministicFailures = runDeterministicChecks(attempt, problem);
    if (deterministicFailures.length > 0) {
      updateAttemptStatus(attemptId, 'Failed', deterministicFailures.join(' '));
      throw new EvaluationServiceError(400, deterministicFailures.join(' '));
    }

    updateAttemptStatus(attemptId, 'Evaluating');

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_key_here') {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Act as an LLD design reviewer. Return ONLY a JSON object with this exact shape: {"overallScore": number, "criteria": [{"criterion": string, "score": number, "evidence": string, "suggestion": string}]}. overallScore and every criterion score must be numbers from 0 to 100. Include exactly these criteria: ${criteria.join(', ')}.`
        },
        {
          role: 'user',
          content: `Problem: ${problem.title}\nDifficulty: ${problem.difficulty}\nDescription: ${problem.description}\nRequired tags: ${problem.tags.join(', ')}\nSubmission type: ${attempt.submissionType}\nSubmission:\n${attempt.submissionText}`
        }
      ]
    });

    const content = completion.choices[0]?.message.content;
    if (!content) {
      throw new Error('OpenAI returned an empty response');
    }

    const aiEvaluation = parseAiResponse(content);
    const result = database.prepare(`
      INSERT INTO evaluations (attempt_id, overall_score, criteria_results)
      VALUES (?, ?, ?)
    `).run(attemptId, aiEvaluation.overallScore, JSON.stringify(aiEvaluation.criteria));

    updateAttemptStatus(attemptId, 'Completed');

    const row = database.prepare(`
      SELECT id, attempt_id, overall_score, criteria_results, created_at
      FROM evaluations
      WHERE id = ?
    `).get(result.lastInsertRowid) as {
      id: number;
      attempt_id: number;
      overall_score: number;
      criteria_results: string;
      created_at: string;
    };

    return {
      id: row.id,
      attemptId: row.attempt_id,
      overallScore: row.overall_score,
      criteriaResults: JSON.parse(row.criteria_results) as CriterionResult[],
      createdAt: row.created_at
    };
  } catch (error) {
    if (error instanceof EvaluationServiceError) {
      throw error;
    }

    console.error('Evaluation failed:', error);
    updateAttemptStatus(attemptId, 'Failed', failedEvaluationMessage);
    throw new EvaluationServiceError(500, failedEvaluationMessage);
  }
}
