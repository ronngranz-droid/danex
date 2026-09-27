import { QuestionCategoryType } from '../types/solver.types';

export class QuestionTypeClassifier {
  static detectQuestionType(text: string): QuestionCategoryType {
    const lower = text.toLowerCase();

    // Check for True / False
    if (
      lower.includes('benar atau salah') ||
      lower.includes('benar/salah') ||
      lower.includes('true or false') ||
      lower.includes('true/false')
    ) {
      return 'true_false';
    }

    // Check for Multiple Choice pattern (A-E or A-D options)
    const mcqPattern = /(?:[A-Ea-e]\s*[\.\)]|\([A-Ea-e]\))\s+[^\n]+/g;
    const matches = text.match(mcqPattern);
    if (matches && matches.length >= 2) {
      // If prompt asks to choose all that apply
      if (lower.includes('pilihlah semua') || lower.includes('select all') || lower.includes('lebih dari satu')) {
        return 'multiple_answer';
      }
      return 'multiple_choice';
    }

    // Check for Programming
    if (
      /\b(def |function|console\.log|import |class |public static void|array|var |let |const |<html>|<script>|syntax error|debugging|python|javascript|php|sql)\b/i.test(lower) ||
      lower.includes('output dari program') ||
      lower.includes('kode berikut')
    ) {
      return 'programming';
    }

    // Check for Calculation
    if (
      lower.includes('hitunglah') ||
      lower.includes('berapa hasil') ||
      lower.includes('tentukan nilai') ||
      lower.includes('calculate') ||
      /[0-9]+\s*[\+\-\*\/=]\s*[0-9]+/.test(lower)
    ) {
      return 'calculation';
    }

    // Check for Definition
    if (
      lower.includes('apakah yang dimaksud') ||
      lower.includes('jelaskan definisi') ||
      lower.includes('pengertian dari') ||
      lower.includes('what is defined as')
    ) {
      return 'definition';
    }

    // Check for Translation
    if (lower.includes('terjemahkan') || lower.includes('translate into') || lower.includes('artinya dalam bahasa')) {
      return 'translation';
    }

    // Check for Essay vs Short answer
    if (lower.includes('jelaskan') || lower.includes('uraikan') || lower.includes('analisislah') || lower.includes('mengapa')) {
      return 'essay';
    }

    return 'general_qa';
  }

  static extractOptions(text: string): Array<{ key: string; text: string }> {
    const options: Array<{ key: string; text: string }> = [];
    const lines = text.split('\n');

    const regex = /(?:^|\s+)([A-Ea-e])[\.\)]\s+(.+)$/;

    for (const line of lines) {
      const match = line.trim().match(regex);
      if (match) {
        options.push({
          key: match[1].toUpperCase(),
          text: match[2].trim()
        });
      }
    }

    // If inline options like "A. foo B. bar C. baz"
    if (options.length < 2) {
      const inlineRegex = /([A-Ea-e])[\.\)]\s+([^A-Ea-e\.\)]+)(?=[A-Ea-e][\.\)]|$)/g;
      let inlineMatch: RegExpExecArray | null;
      while ((inlineMatch = inlineRegex.exec(text)) !== null) {
        options.push({
          key: inlineMatch[1].toUpperCase(),
          text: inlineMatch[2].trim()
        });
      }
    }

    return options;
  }
}
