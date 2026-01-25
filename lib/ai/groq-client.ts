import { createGroq } from '@ai-sdk/groq';

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not set in environment variables');
}

export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Model to use for expense categorization
// Using Llama 4 Scout for native json_schema support
export const CATEGORIZATION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
