import { createGroq } from '@ai-sdk/groq';

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not set in environment variables');
}

export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Model to use for expense categorization
export const CATEGORIZATION_MODEL = 'llama-3.3-70b-versatile';
