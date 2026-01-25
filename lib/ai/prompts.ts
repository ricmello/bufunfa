import { getAllCategories } from '../actions/categories';
import { detectInstallment } from '../utils/installment-detector';

export async function getCategorizationPrompt(
  description: string,
  amount: number
): Promise<string> {
  const categories = await getAllCategories();
  const installmentInfo = detectInstallment(description);
  const recurringHints = getRecurringDetectionHints();

  const categoryList = categories
    .map((cat) => `- ${cat.name}: ${cat.hint || 'No description'}`)
    .join('\n');

  const categoryNames = categories.map((c) => c.name).join(', ');

  let transactionContext = `"${description}" - $${Math.abs(amount).toFixed(2)}`;

  if (installmentInfo.isInstallment) {
    transactionContext += `
(INSTALLMENT DETECTED: ${installmentInfo.currentInstallment}/${installmentInfo.totalInstallments})
Base merchant: "${installmentInfo.baseDescription}"`;
  }

  return `Analyze this credit card transaction from Brazil.

Transaction: ${transactionContext}

Available categories:
${categoryList}

BRAZILIAN CONTEXT:
- Installments format: "MERCHANT 01/12" means 1st of 12 installments
- Installments ARE recurring transactions (monthly payments for same purchase)
- Common recurring services: ${recurringHints.join(', ')}
- Brazilian keywords: ASSINATURA (subscription), MENSALIDADE (monthly fee), ANUIDADE (annual fee)

Determine:
1. Category (choose from list above)
2. Confidence (0-1)
3. Merchant name (extract from description, remove installment suffix if present)
4. Is recurring: true for subscriptions OR installments
5. Budget category suggestion
6. Notes: mention if installment or subscription detected

Return JSON with fields: category, confidence, merchantName, isRecurring, suggestedBudgetCategory, notes.`;
}

export async function getBatchCategorizationPrompt(
  expenses: Array<{ description: string; amount: number }>
): Promise<string> {
  const categories = await getAllCategories();
  const recurringHints = getRecurringDetectionHints();

  const categoryList = categories
    .map((cat) => `- ${cat.name}: ${cat.hint || 'No description'}`)
    .join('\n');

  const categoryNames = categories.map((c) => c.name).join(', ');

  const expenseList = expenses
    .map((e, i) => `${i + 1}. "${e.description}" - $${Math.abs(e.amount).toFixed(2)}`)
    .join('\n');

  return `Analyze these ${expenses.length} credit card transactions from Brazil and categorize each one.

Transactions:
${expenseList}

Available categories: ${categoryNames}

Category Guidelines:
${categoryList}

BRAZILIAN CONTEXT:
- Installments format: "MERCHANT 01/12" means 1st of 12 installments
- Installments ARE recurring (monthly payments for same purchase)
- Common recurring: ${recurringHints.join(', ')}
- Keywords: ASSINATURA (subscription), MENSALIDADE (monthly), ANUIDADE (annual)

For EACH transaction (in order), provide:
- category: One from the list above
- confidence: 0.0 to 1.0
- merchantName: Extract business name (or null)
- isRecurring: Boolean for subscription/recurring charges
- suggestedBudgetCategory: More specific category
- notes: Relevant transaction notes

Return a JSON object with "results" array containing ${expenses.length} categorization objects in the same order.`;
}

export function getRecurringDetectionHints(): string[] {
  return [
    'SUBSCRIPTION',
    'RECURRING',
    'MONTHLY',
    'AUTOPAY',
    'MEMBERSHIP',
    'ASSINATURA',
    'MENSALIDADE',
    'ANUIDADE',
    '*PATREON',
    '*NETFLIX',
    '*SPOTIFY',
    '*ADOBE',
    'INTERNET',
    'INSURANCE',
  ];
}
