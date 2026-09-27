import { z } from 'zod';

export const SubjectEnum = z.enum([
  'mathematics',
  'physics',
  'chemistry',
  'biology',
  'indonesian',
  'english',
  'history',
  'geography',
  'economics',
  'accounting',
  'informatics',
  'programming',
  'general'
]);

export const QuestionTypeEnum = z.enum([
  'multiple_choice',
  'multiple_answer',
  'true_false',
  'short_answer',
  'essay',
  'calculation',
  'definition',
  'translation',
  'programming',
  'general_qa'
]);

export const SolveModeEnum = z.enum(['QUICK', 'LEARN']);

export const OptionItemSchema = z.object({
  key: z.string(),
  text: z.string()
});

export const CodeSnippetSchema = z.object({
  language: z.string(),
  code: z.string()
});

export const SolveTextRequestSchema = z.object({
  prompt: z.string().min(1, 'Pertanyaan tidak boleh kosong'),
  mode: SolveModeEnum.default('QUICK'),
  language: z.string().default('id'),
  explanationLength: z.enum(['concise', 'detailed']).default('concise'),
  inputSource: z.string().optional()
});

export const SolveVisionRequestSchema = z.object({
  imageBase64: z.string().min(10, 'Data gambar base64 tidak valid'),
  mimeType: z.string().default('image/jpeg'),
  prompt: z.string().optional(),
  mode: SolveModeEnum.default('QUICK'),
  language: z.string().default('id'),
  explanationLength: z.enum(['concise', 'detailed']).default('concise')
});

export const FollowUpRequestSchema = z.object({
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string()
    })
  ).min(1, 'Riwayat percakapan tidak boleh kosong'),
  followUpQuestion: z.string().min(1, 'Pertanyaan lanjutan tidak boleh kosong'),
  mode: SolveModeEnum.default('QUICK'),
  language: z.string().default('id')
});

export const DaneXStructuredOutputSchema = z.object({
  status: z.enum([
    'SUCCESS',
    'INCOMPLETE_QUESTION',
    'OPTIONS_INCOMPLETE',
    'LOW_CONFIDENCE',
    'ERROR'
  ]),
  subject: SubjectEnum,
  questionType: QuestionTypeEnum,
  language: z.string(),
  questionExtracted: z.string(),
  options: z.array(OptionItemSchema).default([]),
  answerOption: z.string().nullable().optional(),
  answer: z.string(),
  shortAnswer: z.string(),
  explanation: z.string(),
  steps: z.array(z.string()).default([]),
  latex: z.string().nullable().optional(),
  codeSnippet: CodeSnippetSchema.nullable().optional(),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string()).default([])
});

export type SolveTextRequest = z.infer<typeof SolveTextRequestSchema>;
export type SolveVisionRequest = z.infer<typeof SolveVisionRequestSchema>;
export type FollowUpRequest = z.infer<typeof FollowUpRequestSchema>;
export type DaneXStructuredOutput = z.infer<typeof DaneXStructuredOutputSchema>;
