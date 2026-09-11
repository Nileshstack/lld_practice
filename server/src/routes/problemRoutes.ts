import { Router } from 'express';
import { getProblem, listProblems } from '../services/problemService';

const router = Router();

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.get('/', (_request, response) => {
  try {
    response.json(listProblems());
  } catch (error) {
    console.error('Failed to list problems:', error);
    response.status(500).json({ error: 'Failed to list problems' });
  }
});

router.get('/:id', (request, response) => {
  const id = parseId(request.params.id);
  if (id === null) {
    response.status(400).json({ error: 'id must be a positive integer' });
    return;
  }

  try {
    const problem = getProblem(id);
    if (!problem) {
      response.status(404).json({ error: 'Problem not found' });
      return;
    }

    response.json(problem);
  } catch (error) {
    console.error('Failed to get problem:', error);
    response.status(500).json({ error: 'Failed to get problem' });
  }
});

export default router;
