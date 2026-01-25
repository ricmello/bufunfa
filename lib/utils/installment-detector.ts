export interface InstallmentInfo {
  isInstallment: boolean;
  currentInstallment?: number;
  totalInstallments?: number;
  baseDescription?: string;
}

const INSTALLMENT_PATTERNS = [
  // "DESCRIPTION 01/12" or "DESCRIPTION 1/12"
  /^(.*?)\s+(\d{1,2})\/(\d{1,2})\s*$/,

  // "DESCRIPTION PARC 01 DE 12" or "PARCELA 01 DE 12"
  /^(.*?)\s+(?:PARC(?:ELA)?\.?\s+)?(\d{1,2})\s+DE\s+(\d{1,2})\s*$/i,

  // "DESCRIPTION (01/12)" or "DESCRIPTION [1/12]"
  /^(.*?)\s*[\(\[](\d{1,2})\/(\d{1,2})[\)\]]\s*$/,

  // "DESCRIPTION P01/12"
  /^(.*?)\s+P(\d{1,2})\/(\d{1,2})\s*$/i,
];

export function detectInstallment(description: string): InstallmentInfo {
  const trimmed = description.trim();

  for (const pattern of INSTALLMENT_PATTERNS) {
    const match = trimmed.match(pattern);

    if (match) {
      const [, baseDesc, current, total] = match;
      const currentNum = parseInt(current, 10);
      const totalNum = parseInt(total, 10);

      // Validate: current <= total, reasonable total (2-99)
      if (currentNum > 0 && currentNum <= totalNum && totalNum >= 2 && totalNum <= 99) {
        return {
          isInstallment: true,
          currentInstallment: currentNum,
          totalInstallments: totalNum,
          baseDescription: baseDesc.trim(),
        };
      }
    }
  }

  return { isInstallment: false };
}

export function isLikelyRecurring(description: string, hints: string[] = []): boolean {
  const upper = description.toUpperCase();

  // Check against hints
  for (const hint of hints) {
    if (upper.includes(hint.toUpperCase())) {
      return true;
    }
  }

  // Brazilian recurring keywords
  const brazilianKeywords = ['ASSINATURA', 'MENSALIDADE', 'ANUIDADE', 'RECORRENTE'];
  for (const keyword of brazilianKeywords) {
    if (upper.includes(keyword)) {
      return true;
    }
  }

  return false;
}
