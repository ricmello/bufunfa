import { generateObject } from 'ai';
import { z } from 'zod';
import { groq, CATEGORIZATION_MODEL } from './groq-client';

const FilenameParseSchema = z.object({
  month: z.number().min(1).max(12).nullable(),
  year: z.number().min(2000).max(2099).nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
  reasoning: z.string(),
});

export async function extractDateWithAI(filename: string): Promise<{
  month?: number;
  year?: number;
  confidence: string;
}> {
  try {
    const prompt = `Extract the statement month and year from this credit card statement filename: "${filename}"

Common patterns:
- "fatura-202503.csv" → March 2025
- "statement_Mar_2025.csv" → March 2025
- "fatura outubro 2025 (2).csv" → October 2025 (Portuguese month name)
- "cc_march.csv" → March [year unclear]

Portuguese months: Janeiro, Fevereiro, Março, Abril, Maio, Junho, Julho, Agosto, Setembro, Outubro, Novembro, Dezembro
English months: January, February, March, April, May, June, July, August, September, October, November, December

Return:
- month: 1-12 (or null if unclear)
- year: 2000-2099 (or null if unclear)
- confidence: how certain are you? (high/medium/low)
- reasoning: explain your interpretation

Return JSON only.`;

    const { object } = await generateObject({
      model: groq(CATEGORIZATION_MODEL),
      schema: FilenameParseSchema,
      prompt,
      temperature: 0.2,
    });

    console.log(object);

    return {
      month: object.month ?? undefined,
      year: object.year ?? undefined,
      confidence: object.confidence,
    };
  } catch (error) {
    console.error('Error parsing filename with AI:', error);
    return { confidence: 'low' };
  }
}
