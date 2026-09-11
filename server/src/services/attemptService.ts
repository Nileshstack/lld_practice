import database from '../db/db';
import { Attempt, SubmissionType } from '../models/attempt';
import { CriterionResult, Evaluation } from '../models/evaluation';

interface AttemptRow {
  id: number;
  problem_id: number;
  user_id: string;
  submission_text: string;
  submission_type: SubmissionType;
  status: Attempt['status'];
  created_at: string;
}

interface EvaluationRow {
  id: number;
  attempt_id: number;
  overall_score: number;
  criteria_results: string;
  created_at: string;
}

function toAttempt(row: AttemptRow): Attempt {
  return {
    id: row.id,
    problemId: row.problem_id,
    userId: row.user_id,
    submissionText: row.submission_text,
    submissionType: row.submission_type,
    status: row.status,
    createdAt: row.created_at
  };
}

function toEvaluation(row: EvaluationRow): Evaluation {
  return {
    id: row.id,
    attemptId: row.attempt_id,
    overallScore: row.overall_score,
    criteriaResults: JSON.parse(row.criteria_results) as CriterionResult[],
    createdAt: row.created_at
  };
}

export interface AttemptWithEvaluation extends Attempt {
  evaluation: Evaluation | null;
}

export function createAttempt(input: {
  problemId: number;
  submissionText: string;
  submissionType: SubmissionType;
}): Attempt {
  const result = database.prepare(`
    INSERT INTO attempts (problem_id, user_id, submission_text, submission_type, status)
    VALUES (?, ?, ?, ?, 'Submitted')
  `).run(input.problemId, 'anonymous', input.submissionText, input.submissionType);

  const row = database.prepare(`
    SELECT id, problem_id, user_id, submission_text, submission_type, status, created_at
    FROM attempts
    WHERE id = ?
  `).get(result.lastInsertRowid) as AttemptRow;

  return toAttempt(row);
}

export function listAttempts(problemId?: number): AttemptWithEvaluation[] {
  const query = problemId === undefined
    ? database.prepare(`
        SELECT id, problem_id, user_id, submission_text, submission_type, status, created_at
        FROM attempts
        ORDER BY id DESC
      `)
    : database.prepare(`
        SELECT id, problem_id, user_id, submission_text, submission_type, status, created_at
        FROM attempts
        WHERE problem_id = ?
        ORDER BY id DESC
      `);

  const rows = (problemId === undefined ? query.all() : query.all(problemId)) as AttemptRow[];
  return rows.map((row) => getAttempt(row.id)!);
}

export function getAttempt(id: number): AttemptWithEvaluation | null {
  const attemptRow = database.prepare(`
    SELECT id, problem_id, user_id, submission_text, submission_type, status, created_at
    FROM attempts
    WHERE id = ?
  `).get(id) as AttemptRow | undefined;

  if (!attemptRow) {
    return null;
  }

  const evaluationRow = database.prepare(`
    SELECT id, attempt_id, overall_score, criteria_results, created_at
    FROM evaluations
    WHERE attempt_id = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(id) as EvaluationRow | undefined;

  return {
    ...toAttempt(attemptRow),
    evaluation: evaluationRow ? toEvaluation(evaluationRow) : null
  };
}
