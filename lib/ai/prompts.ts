import { EXPENSE_CATEGORIES } from '../types/expense';

export function getCategorizationPrompt(description: string, amount: number): string {
  return `Analyze this credit card transaction and categorize it accurately.

Transaction Details:
- Description: "${description}"
- Amount: $${Math.abs(amount).toFixed(2)}

Your task:
1. Assign ONE category from this list: ${EXPENSE_CATEGORIES.join(', ')}
2. Determine your confidence level (0.0 to 1.0)
3. Extract the merchant/business name if identifiable (or null if not clear)
4. Detect if this appears to be a recurring/subscription charge
5. Suggest which budget category this fits (can be same as main category or more specific)
6. Add any relevant notes about the transaction

Guidelines:
- Food: Restaurants, grocery stores, cafes, food delivery
- Transport: Gas, public transit, ride-sharing, parking, vehicle services
- Shopping: Retail purchases, online shopping, clothing, electronics
- Entertainment: Movies, streaming, games, events, hobbies
- Bills: Utilities, phone, internet, insurance, subscriptions
- Health: Medical, pharmacy, fitness, wellness
- Other: Anything that doesn't fit above categories

Return your analysis in JSON format with fields: category, confidence, merchantName, isRecurring, suggestedBudgetCategory, notes.`;
}

export function getRecurringDetectionHints(): string[] {
  return [
    'SUBSCRIPTION',
    'RECURRING',
    'MONTHLY',
    'AUTOPAY',
    'MEMBERSHIP',
    '*PATREON',
    '*NETFLIX',
    '*SPOTIFY',
    '*ADOBE',
    'INTERNET',
    'INSURANCE',
  ];
}
