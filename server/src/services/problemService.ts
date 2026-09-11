import database from '../db/db';
import { Problem } from '../models/problem';

interface ProblemRow {
  id: number;
  title: string;
  description: string;
  difficulty: Problem['difficulty'];
  tags: string;
  created_at: string;
}

function toProblem(row: ProblemRow): Problem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty,
    tags: JSON.parse(row.tags) as string[],
    createdAt: row.created_at
  };
}

export function listProblems(): Problem[] {
  const rows = database.prepare(`
    SELECT id, title, description, difficulty, tags, created_at
    FROM problems
    ORDER BY id
  `).all() as ProblemRow[];

  return rows.map(toProblem);
}

export function getProblem(id: number): Problem | null {
  const row = database.prepare(`
    SELECT id, title, description, difficulty, tags, created_at
    FROM problems
    WHERE id = ?
  `).get(id) as ProblemRow | undefined;

  return row ? toProblem(row) : null;
}
