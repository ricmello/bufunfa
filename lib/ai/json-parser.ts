import { z } from 'zod';
import { generateText } from 'ai';
import { groq, CATEGORIZATION_MODEL } from './groq-client';

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  rawResponse?: string;
}

export function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();

  // Remove markdown code blocks (```, ```json)
  cleaned = cleaned.replace(/^```(?:json)?\n?/gm, '');
  cleaned = cleaned.replace(/\n?```$/gm, '');

  // Remove wrapping quotes (", """, `)
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1).replace(/\\"/g, '"');
  }
  if (cleaned.startsWith('"""') && cleaned.endsWith('"""')) {
    cleaned = cleaned.slice(3, -3);
  }
  cleaned = cleaned.replace(/^`+|`+$/g, '');

  return cleaned;
}

export function extractJsonFromText(text: string): string | null {
  const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
  const jsonArrayMatch = text.match(/\[[\s\S]*\]/);

  if (jsonObjectMatch) return jsonObjectMatch[0];
  if (jsonArrayMatch) return jsonArrayMatch[0];

  return null;
}

export async function parseWithRetry<T>(
  rawResponse: string,
  schema: z.ZodSchema<T>,
  retryPrompt: (error: string, attempt: number) => string,
  maxRetries: number = 3
): Promise<ParseResult<T>> {
  let cleaned = cleanJsonString(rawResponse);

  // Attempt 1: Parse cleaned string
  try {
    const parsed = JSON.parse(cleaned);
    const validated = schema.parse(parsed);
    return { success: true, data: validated };
  } catch (parseError) {
    // Try extracting JSON if embedded in text
    const extracted = extractJsonFromText(cleaned);
    if (extracted) {
      try {
        const parsed = JSON.parse(extracted);
        const validated = schema.parse(parsed);
        return { success: true, data: validated };
      } catch {
        // Continue to retry logic
      }
    }
  }

  // Retry with AI to fix JSON
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const fixPrompt = retryPrompt(cleaned, attempt);
      const { text } = await generateText({
        model: groq(CATEGORIZATION_MODEL),
        prompt: fixPrompt,
        temperature: 0.1,
      });

      const fixedCleaned = cleanJsonString(text);
      const parsed = JSON.parse(fixedCleaned);
      const validated = schema.parse(parsed);

      return { success: true, data: validated };
    } catch (retryError) {
      if (attempt === maxRetries) {
        return {
          success: false,
          error: `Failed after ${maxRetries} retries: ${retryError}`,
          rawResponse: cleaned,
        };
      }
    }
  }

  return { success: false, error: 'Unknown error', rawResponse: cleaned };
}
