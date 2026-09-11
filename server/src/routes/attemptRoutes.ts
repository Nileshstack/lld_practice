import { Router } from 'express';
import { SubmissionType } from '../models/attempt';
import { createAttempt, getAttempt, listAttempts } from '../services/attemptService';
import { evaluateAttempt } from '../services/evaluationService';
import { getProblem } from '../services/problemService';

const router = Router();
const submissionTypes: SubmissionType[] = ['text', 'code', 'diagram'];

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.get('/', (request, response) => {
  const problemIdValue = request.query.problemId;
  let problemId: number | undefined;

  if (problemIdValue !== undefined) {
    if (typeof problemIdValue !== 'string') {
      response.status(400).json({ error: 'problemId must be a positive integer' });
      return;
    }
    problemId = parseId(problemIdValue) ?? undefined;
    if (problemId === undefined) {
      response.status(400).json({ error: 'problemId must be a positive integer' });
      return;
    }
  }

  try {
    response.json(listAttempts(problemId));
  } catch (error) {
    console.error('Failed to list attempts:', error);
    response.status(500).json({ error: 'Failed to list attempts' });
  }
});

router.post('/', (request, response) => {
  const { problemId, submissionText, submissionType } = request.body ?? {};
  const parsedProblemId = typeof problemId === 'number' && Number.isInteger(problemId) && problemId > 0
    ? problemId
    : null;

  if (parsedProblemId === null || typeof submissionText !== 'string' || !submissionText.trim()) {
    response.status(400).json({ error: 'problemId and submissionText are required' });
    return;
  }

  if (!submissionTypes.includes(submissionType)) {
    response.status(400).json({ error: 'submissionType must be text, code, or diagram' });
    return;
  }

  try {
    if (!getProblem(parsedProblemId)) {
      response.status(404).json({ error: 'Problem not found' });
      return;
    }

    response.status(201).json(createAttempt({
      problemId: parsedProblemId,
      submissionText: submissionText.trim(),
      submissionType
    }));
  } catch (error) {
    console.error('Failed to create attempt:', error);
    response.status(500).json({ error: 'Failed to create attempt' });
  }
});

router.post('/:id/evaluate', async (request, response) => {
  const id = parseId(request.params.id);
  if (id === null) {
    response.status(400).json({ error: 'id must be a positive integer' });
    return;
  }

  try {
    const attempt = getAttempt(id);
    if (!attempt) {
      response.status(404).json({ error: 'Attempt not found' });
      return;
    }

    const problem = getProblem(attempt.problemId);
    if (!problem) {
      response.status(404).json({ error: 'Problem not found' });
      return;
    }

    response.json(await evaluateAttempt(attempt, problem));
  } catch (error) {
    console.error('Evaluation request failed:', error);
    response.status(500).json({ error: 'Evaluation failed. Please try again later.' });
  }
});

router.get('/:id', (request, response) => {
  const id = parseId(request.params.id);
  if (id === null) {
    response.status(400).json({ error: 'id must be a positive integer' });
    return;
  }

  try {
    const attempt = getAttempt(id);
    if (!attempt) {
      response.status(404).json({ error: 'Attempt not found' });
      return;
    }

    response.json(attempt);
  } catch (error) {
    console.error('Failed to get attempt:', error);
    response.status(500).json({ error: 'Failed to get attempt' });
  }
});

export default router;
