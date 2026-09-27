import { describe, it, expect } from 'vitest';
import { LanguageClassifier } from '../src/classifiers/language.classifier';
import { SubjectClassifier } from '../src/classifiers/subject.classifier';
import { QuestionTypeClassifier } from '../src/classifiers/question-type.classifier';

describe('Classifiers Test Suite', () => {
  describe('LanguageClassifier', () => {
    it('detects Indonesian text correctly', () => {
      const text = 'Manakah organel sel yang berfungsi menghasilkan energi ATP dalam sel eukariotik?';
      expect(LanguageClassifier.detectLanguage(text)).toBe('id');
    });

    it('detects English text correctly', () => {
      const text = 'Which of the following cellular organelles is primarily responsible for ATP synthesis?';
      expect(LanguageClassifier.detectLanguage(text)).toBe('en');
    });
  });

  describe('SubjectClassifier', () => {
    it('classifies Mathematics questions', () => {
      expect(SubjectClassifier.detectSubject('Tentukan akar persamaan kuadrat x^2 - 5x + 6 = 0')).toBe('mathematics');
      expect(SubjectClassifier.detectSubject('Hitunglah integral dari \\frac{1}{x} dx')).toBe('mathematics');
    });

    it('classifies Biology questions', () => {
      expect(SubjectClassifier.detectSubject('Organel mitokondria berperan dalam respirasi sel')).toBe('biology');
      expect(SubjectClassifier.detectSubject('Proses pembelahan meiosis menghasilkan 4 sel anak')).toBe('biology');
    });

    it('classifies Chemistry questions', () => {
      expect(SubjectClassifier.detectSubject('Hitung massa molar senyawa H2SO4 dengan konsentrasi 0.1 mol')).toBe('chemistry');
      expect(SubjectClassifier.detectSubject('Setarakan reaksi kimia berikut: 2H2 + O2 -> 2H2O')).toBe('chemistry');
    });

    it('classifies Physics questions', () => {
      expect(SubjectClassifier.detectSubject('Sebuah mobil bergerak dengan kecepatan 20 m/s dan gaya newton 500 N')).toBe('physics');
    });

    it('classifies Programming questions', () => {
      expect(SubjectClassifier.detectSubject('def hitung_total(arr):\n    return sum(arr)')).toBe('programming');
      expect(SubjectClassifier.detectSubject('Apa output dari console.log(1 + "2") di javascript?')).toBe('programming');
    });
  });

  describe('QuestionTypeClassifier', () => {
    it('detects Multiple Choice and extracts options', () => {
      const question = `Organel sel manakah yang memproduksi ATP?
A. Nukleus
B. Ribosom
C. Mitokondria
D. Lisosom`;

      expect(QuestionTypeClassifier.detectQuestionType(question)).toBe('multiple_choice');
      const options = QuestionTypeClassifier.extractOptions(question);
      expect(options).toHaveLength(4);
      expect(options[0]).toEqual({ key: 'A', text: 'Nukleus' });
      expect(options[2]).toEqual({ key: 'C', text: 'Mitokondria' });
    });

    it('detects True / False questions', () => {
      const tf = 'Pernyataan berikut benar atau salah: Mitokondria memiliki DNA sendiri.';
      expect(QuestionTypeClassifier.detectQuestionType(tf)).toBe('true_false');
    });

    it('detects Calculation questions', () => {
      const calc = 'Hitunglah berapa nilai dari 12 * 8 = ?';
      expect(QuestionTypeClassifier.detectQuestionType(calc)).toBe('calculation');
    });
  });
});
