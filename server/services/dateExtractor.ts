export class DateExtractor {
  private datePatterns = [
    // Various date formats
    /(?:expir[ey]|valid|expires?)(?:\s+(?:date|on|until|through|thru))?\s*:?\s*([a-z]+ \d{1,2},?\s+\d{4})/i,
    /(?:expir[ey]|valid|expires?)(?:\s+(?:date|on|until|through|thru))?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
    /(?:expir[ey]|valid|expires?)(?:\s+(?:date|on|until|through|thru))?\s*:?\s*(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i,
    /(?:valid\s+(?:until|through|thru))\s*:?\s*([a-z]+ \d{1,2},?\s+\d{4})/i,
    /(?:valid\s+(?:until|through|thru))\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
    /(?:valid\s+(?:until|through|thru))\s*:?\s*(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i,
    // Standalone date patterns near expiry keywords
    /expir[ey].*?([a-z]+ \d{1,2},?\s+\d{4})/i,
    /expir[ey].*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
    /expir[ey].*?(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i,
  ];

  extractExpiryDate(text: string): { date: Date | null; confidence: number } {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    for (const pattern of this.datePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const dateStr = match[1];
        const parsedDate = this.parseDate(dateStr);
        
        if (parsedDate && this.isValidExpiryDate(parsedDate)) {
          return {
            date: parsedDate,
            confidence: this.calculateConfidence(pattern, match[0])
          };
        }
      }
    }

    return { date: null, confidence: 0 };
  }

  private parseDate(dateStr: string): Date | null {
    const cleanDateStr = dateStr.trim();

    // Try parsing common formats
    const formats = [
      // Named months
      /^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/i,
      // MM/DD/YYYY or MM-DD-YYYY
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
      // YYYY/MM/DD or YYYY-MM-DD
      /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
    ];

    for (const format of formats) {
      const match = cleanDateStr.match(format);
      if (match) {
        if (format.source.includes('([a-z]+)')) {
          // Named month format
          const [, monthName, day, year] = match;
          const date = new Date(`${monthName} ${day}, ${year}`);
          if (!isNaN(date.getTime())) return date;
        } else if (format.source.includes('(\\d{4})') && format.source.indexOf('(\\d{4})') === 0) {
          // YYYY-MM-DD format
          const [, year, month, day] = match;
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(date.getTime())) return date;
        } else {
          // MM/DD/YYYY format
          const [, month, day, year] = match;
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(date.getTime())) return date;
        }
      }
    }

    // Fallback to native Date parsing
    const fallbackDate = new Date(cleanDateStr);
    return !isNaN(fallbackDate.getTime()) ? fallbackDate : null;
  }

  private isValidExpiryDate(date: Date): boolean {
    const now = new Date();
    const fiveYearsFromNow = new Date(now.getTime() + (5 * 365 * 24 * 60 * 60 * 1000));
    const fiveYearsAgo = new Date(now.getTime() - (5 * 365 * 24 * 60 * 60 * 1000));
    
    // Expiry dates should be reasonable (not too far in past/future)
    return date >= fiveYearsAgo && date <= fiveYearsFromNow;
  }

  private calculateConfidence(pattern: RegExp, matchedText: string): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on pattern specificity
    if (pattern.source.includes('expir')) confidence += 0.3;
    if (pattern.source.includes('valid')) confidence += 0.2;
    if (pattern.source.includes(':')) confidence += 0.1;

    // Increase confidence for more specific matches
    if (matchedText.toLowerCase().includes('expiry date')) confidence += 0.2;
    if (matchedText.toLowerCase().includes('valid until')) confidence += 0.2;
    if (matchedText.toLowerCase().includes('expires')) confidence += 0.15;

    return Math.min(confidence, 0.95); // Cap at 95%
  }
}

export const dateExtractor = new DateExtractor();
