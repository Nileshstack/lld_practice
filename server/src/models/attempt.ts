export type SubmissionType = 'text' | 'code' | 'diagram';
export type AttemptStatus = 'Submitted' | 'Evaluating' | 'Completed' | 'Failed';

export interface Attempt {
  id: number;
  problemId: number;
  userId: string;
  submissionText: string;
  submissionType: SubmissionType;
  status: AttemptStatus;
  createdAt: string;
}

export interface CreateAttemptInput {
  problemId: number;
  userId: string;
  submissionText: string;
  submissionType: SubmissionType;
}
