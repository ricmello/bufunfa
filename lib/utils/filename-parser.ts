export interface DateExtraction {
  month?: number; // 1-12
  year?: number;
  confidence: 'high' | 'medium' | 'low' | 'none';
  method: 'regex' | 'ai' | 'fallback';
}

const MONTH_NAMES_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'marco',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const MONTH_NAMES_EN = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

const MONTH_ABBREV_EN = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

export function extractDateFromFilename(filename: string): DateExtraction {
  const cleaned = filename
    .toLowerCase()
    .replace(/\.csv$/, '')
    .replace(/[_\-\(\)\[\]]/g, ' ')
    .trim();

  // Pattern 1: YYYYMMDD (e.g., 20250307 → 2025-03)
  const yyyymmddMatch = cleaned.match(/(\d{4})(\d{2})(\d{2})?/);
  if (yyyymmddMatch) {
    const [, year, month] = yyyymmddMatch;
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    if (yearNum >= 2000 && yearNum <= 2099 && monthNum >= 1 && monthNum <= 12) {
      return { year: yearNum, month: monthNum, confidence: 'high', method: 'regex' };
    }
  }

  // Pattern 2: YYYY-MM or YYYY/MM
  const dashMatch = cleaned.match(/(\d{4})\s*[\-\/]\s*(\d{1,2})/);
  if (dashMatch) {
    const yearNum = parseInt(dashMatch[1], 10);
    const monthNum = parseInt(dashMatch[2], 10);

    if (yearNum >= 2000 && yearNum <= 2099 && monthNum >= 1 && monthNum <= 12) {
      return { year: yearNum, month: monthNum, confidence: 'high', method: 'regex' };
    }
  }

  // Pattern 3: Month name (Portuguese or English) + year
  let foundMonth: number | undefined;
  let foundYear: number | undefined;

  // Check Portuguese month names
  MONTH_NAMES_PT.forEach((name, index) => {
    if (cleaned.includes(name)) {
      foundMonth = index + 1;
    }
  });

  // Check English month names
  if (!foundMonth) {
    MONTH_NAMES_EN.forEach((name, index) => {
      if (cleaned.includes(name)) {
        foundMonth = index + 1;
      }
    });
  }

  // Check abbreviations
  if (!foundMonth) {
    MONTH_ABBREV_EN.forEach((abbr, index) => {
      if (cleaned.includes(abbr)) {
        foundMonth = index + 1;
      }
    });
  }

  // Find year
  const yearMatch = cleaned.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    foundYear = parseInt(yearMatch[1], 10);
  }

  if (foundMonth && foundYear) {
    return { month: foundMonth, year: foundYear, confidence: 'high', method: 'regex' };
  }

  if (foundMonth || foundYear) {
    return { month: foundMonth, year: foundYear, confidence: 'medium', method: 'regex' };
  }

  return { confidence: 'none', method: 'regex' };
}
