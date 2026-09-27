export type SubjectType =
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'indonesian'
  | 'english'
  | 'history'
  | 'geography'
  | 'economics'
  | 'accounting'
  | 'informatics'
  | 'programming'
  | 'general';

export type QuestionCategoryType =
  | 'multiple_choice'
  | 'multiple_answer'
  | 'true_false'
  | 'short_answer'
  | 'essay'
  | 'calculation'
  | 'definition'
  | 'translation'
  | 'programming'
  | 'general_qa';

export type SolveMode = 'QUICK' | 'LEARN';

export type SolveStatus =
  | 'SUCCESS'
  | 'INCOMPLETE_QUESTION'
  | 'OPTIONS_INCOMPLETE'
  | 'LOW_CONFIDENCE'
  | 'CAPTURE_NOT_ALLOWED'
  | 'OCR_FAILED'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'ERROR';

export interface OptionItem {
  key: string; // e.g. "A", "B", "C", "D", "E"
  text: string;
}

export interface CodeSnippet {
  language: string;
  code: string;
}

export interface SolverContext {
  language?: string;
  subject?: SubjectType;
  questionType?: QuestionCategoryType;
  mode: SolveMode;
  explanationLength?: 'concise' | 'detailed';
  clientIp?: string;
}

export interface SolverRawResponse {
  rawText: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface FollowUpMessage {
  role: 'user' | 'assistant';
  content: string;
}
