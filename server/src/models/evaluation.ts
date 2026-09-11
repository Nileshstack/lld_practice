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

export interface CreateEvaluationInput {
  attemptId: number;
  overallScore: number;
  criteriaResults: CriterionResult[];
}
