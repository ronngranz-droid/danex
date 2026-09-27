import { GoogleGenerativeAI } from '@google/generative-ai';
import { FollowUpMessage, SolverContext, SolverRawResponse } from '../types/solver.types';
import { SolverProvider } from './solver-provider.interface';

export class GeminiProvider implements SolverProvider {
  readonly id = 'gemini-provider';
  readonly name = 'Google Gemini Multimodal AI';
  private genAI: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = 'gemini-1.5-flash') {
    this.modelName = process.env.GEMINI_MODEL || modelName;
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
    }
  }

  isConfigured(): boolean {
    return this.genAI !== null;
  }

  async solveText(prompt: string, context: SolverContext): Promise<SolverRawResponse> {
    if (!this.genAI) {
      throw new Error('GEMINI_API_KEY is not configured in backend environment');
    }

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const systemPrompt = `You are DaneX Academic Engine, a precise universal study assistant.
Return ONLY valid JSON strictly complying with this schema:
{
  "status": "SUCCESS" | "INCOMPLETE_QUESTION" | "OPTIONS_INCOMPLETE" | "LOW_CONFIDENCE" | "ERROR",
  "subject": "mathematics" | "physics" | "chemistry" | "biology" | "indonesian" | "english" | "history" | "geography" | "economics" | "accounting" | "informatics" | "programming" | "general",
  "questionType": "multiple_choice" | "multiple_answer" | "true_false" | "short_answer" | "essay" | "calculation" | "definition" | "translation" | "programming" | "general_qa",
  "language": string (ISO code, e.g. "id"),
  "questionExtracted": string,
  "options": [ { "key": "A", "text": "..." } ],
  "answerOption": string | null,
  "answer": string,
  "shortAnswer": string,
  "explanation": string,
  "steps": string[],
  "latex": string | null,
  "codeSnippet": { "language": string, "code": string } | null,
  "confidence": number between 0 and 1,
  "warnings": string[]
}

Rules:
1. Mode is ${context.mode}. If QUICK: provide short concise explanation and empty steps. If LEARN: provide detailed step-by-step breakdown.
2. For multiple choice (A-E), extract options cleanly. If options or question are cut off/incomplete, return status "INCOMPLETE_QUESTION" or "OPTIONS_INCOMPLETE" and DO NOT guess.
3. For Math, use canonical LaTeX in "latex" field (e.g. \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}). Never output raw unformatted formulas.
4. For Science (Physics/Chemistry), keep units, scientific notation (e.g. 6.02 x 10^23) and reaction arrows (e.g. 2H2 + O2 -> 2H2O).
5. For Programming, supply code in "codeSnippet".`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `Question:\n${prompt}` }
    ]);

    const response = await result.response;
    const rawText = response.text();

    const inputTokens = response.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4);
    const outputTokens = response.usageMetadata?.candidatesTokenCount || Math.ceil(rawText.length / 4);

    return {
      rawText,
      inputTokens,
      outputTokens,
      model: this.modelName
    };
  }

  async solveImage(
    imageBase64: string,
    mimeType: string,
    prompt: string,
    context: SolverContext
  ): Promise<SolverRawResponse> {
    if (!this.genAI) {
      throw new Error('GEMINI_API_KEY is not configured in backend environment');
    }

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const instruction = `Analyze the question image and return structured academic response as valid JSON matching DaneX schema.
Extract all visible text, diagram elements, options, and solve accurately.`;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || 'image/jpeg'
      }
    };

    const result = await model.generateContent([
      instruction,
      prompt ? `Additional hint/text: ${prompt}` : 'Solve the question in the image.',
      imagePart
    ]);

    const response = await result.response;
    const rawText = response.text();

    const inputTokens = response.usageMetadata?.promptTokenCount || 300;
    const outputTokens = response.usageMetadata?.candidatesTokenCount || Math.ceil(rawText.length / 4);

    return {
      rawText,
      inputTokens,
      outputTokens,
      model: this.modelName
    };
  }

  async solveFollowUp(
    history: FollowUpMessage[],
    context: SolverContext
  ): Promise<SolverRawResponse> {
    if (!this.genAI) {
      throw new Error('GEMINI_API_KEY is not configured in backend environment');
    }

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const messages = history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n\n');
    const prompt = `Based on the following study conversation history, answer the user's follow-up inquiry in structured DaneX JSON schema:\n\n${messages}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();

    const inputTokens = response.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4);
    const outputTokens = response.usageMetadata?.candidatesTokenCount || Math.ceil(rawText.length / 4);

    return {
      rawText,
      inputTokens,
      outputTokens,
      model: this.modelName
    };
  }
}
