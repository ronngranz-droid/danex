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
  | 'IDLE'
  | 'READING'
  | 'UNDERSTANDING'
  | 'SOLVING'
  | 'VERIFYING'
  | 'SUCCESS'
  | 'INCOMPLETE_QUESTION'
  | 'OPTIONS_INCOMPLETE'
  | 'LOW_CONFIDENCE'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'NO_INTERNET'
  | 'ERROR';

export interface OptionItem {
  key: string;
  text: string;
}

export interface CodeSnippet {
  language: string;
  code: string;
}

export interface SolveResult {
  id: string;
  questionExtracted: string;
  subject: SubjectType;
  questionType: QuestionCategoryType;
  language: string;
  options: OptionItem[];
  answerOption?: string | null;
  answer: string;
  shortAnswer: string;
  explanation: string;
  steps: string[];
  latex?: string | null;
  codeSnippet?: CodeSnippet | null;
  confidence: number;
  solveMode: SolveMode;
  inputSource: string;
  timestamp: number;
  warnings: string[];
  imageThumbnail?: string;
}

export interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  budgetTokens: number;
  remainingTokens: number;
  usagePercentage: number;
  warning80Exceeded: boolean;
  warning95Exceeded: boolean;
  budgetExhausted: boolean;
}
