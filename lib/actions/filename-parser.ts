'use server';

import { extractDateFromFilename } from '../utils/filename-parser';
import { extractDateWithAI } from '../ai/filename-ai-parser';

export interface ParsedFilenameDate {
  month?: number;
  year?: number;
  autoDetected: boolean;
}

export async function parseFilenameDate(filename: string): Promise<ParsedFilenameDate> {
  try {
    // Phase 1: Try regex extraction
    const dateExtraction = extractDateFromFilename(filename);
    console.log(dateExtraction);

    if (dateExtraction.confidence === 'high' && dateExtraction.month && dateExtraction.year) {
      // High confidence from regex
      return {
        month: dateExtraction.month,
        year: dateExtraction.year,
        autoDetected: true,
      };
    }

    if (dateExtraction.confidence === 'none') {
      // Phase 2: Try AI extraction
      const aiResult = await extractDateWithAI(filename);
      if (aiResult.month && aiResult.year && aiResult.confidence !== 'low') {
        return {
          month: aiResult.month,
          year: aiResult.year,
          autoDetected: true,
        };
      }
    }

    if (dateExtraction.confidence === 'medium' && (dateExtraction.month || dateExtraction.year)) {
      // Medium confidence or partial extraction
      return {
        month: dateExtraction.month,
        year: dateExtraction.year,
        autoDetected: true,
      };
    }

    // Phase 3: No detection, return empty (fallback to current date in UI)
    return {
      autoDetected: false,
    };
  } catch (error) {
    console.error('Error parsing filename date:', error);
    return {
      autoDetected: false,
    };
  }
}
