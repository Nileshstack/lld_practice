export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: Difficulty;
  /** JSON stored in SQLite as an array of strings. */
  tags: string[];
  createdAt: string;
}

export interface CreateProblemInput {
  title: string;
  description: string;
  difficulty: Difficulty;
  tags: string[];
}
