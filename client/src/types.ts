export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: Difficulty;
  tags: string[];
  createdAt: string;
}

export interface Attempt {
  id: number;
  problemId: number;
  submissionText: string;
  submissionType: 'text' | 'code';
  status: string;
  createdAt: string;
}

export interface CriterionResult {
  criterion: string;
  score: number;
  evidence: string;
  suggestion: string;
}

export interface Evaluation {
  id: number;
  attemptId: number;
  overallScore: number;
  criteriaResults: CriterionResult[];
  createdAt: string;
}

export interface AttemptDetail extends Attempt {
  evaluation: Evaluation | null;
}
