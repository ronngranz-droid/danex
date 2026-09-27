export class LanguageClassifier {
  static detectLanguage(text: string): string {
    const lower = text.toLowerCase();

    // Indonesian vocabulary markers
    const idMarkers = [
      ' yang ', ' dan ', ' di ', ' dari ', ' adalah ', ' manakah ', ' apakah ', 
      ' berikut ', ' dengan ', ' untuk ', ' pada ', ' dalam ', ' sebuah ', ' jika ',
      ' tentukan ', ' berapa ', ' hitunglah ', ' jelaskan ', ' sebutkan '
    ];

    let idScore = 0;
    for (const marker of idMarkers) {
      if (lower.includes(marker)) idScore += 1;
    }

    // English vocabulary markers
    const enMarkers = [
      ' the ', ' and ', ' of ', ' is ', ' which ', ' what ', ' following ',
      ' with ', ' for ', ' in ', ' if ', ' calculate ', ' determine ', ' explain '
    ];

    let enScore = 0;
    for (const marker of enMarkers) {
      if (lower.includes(marker)) enScore += 1;
    }

    if (idScore >= enScore && idScore > 0) return 'id';
    if (enScore > idScore) return 'en';

    return 'id'; // default fallback
  }
}
