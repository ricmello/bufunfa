import type { Participant } from '../types/split-event';
import type { SplitCalculation, SettlementTransaction } from '../types/split-calculation';

/**
 * Calculate each participant's share and balance based on weights
 *
 * @param participants - Array of participants with weights and amounts paid
 * @param totalAmount - Total amount to be split
 * @returns Array of calculations showing share and balance for each participant
 */
export function calculateSplits(
  participants: Participant[],
  totalAmount: number
): SplitCalculation[] {
  // Handle edge cases
  if (participants.length === 0 || totalAmount === 0) {
    return participants.map(p => ({
      participantId: p.id,
      name: p.name,
      weight: p.weight,
      amountPaid: p.amountPaid,
      share: 0,
      balance: p.amountPaid,
    }));
  }

  const totalWeights = participants.reduce((sum, p) => sum + p.weight, 0);
  const baseShare = totalAmount / totalWeights;

  return participants.map(p => {
    const share = baseShare * p.weight;
    const balance = p.amountPaid - share;

    return {
      participantId: p.id,
      name: p.name,
      weight: p.weight,
      amountPaid: p.amountPaid,
      share,
      balance,
    };
  });
}

/**
 * Calculate settlement transactions (who owes whom)
 * Uses greedy algorithm to minimize number of transactions
 *
 * @param calculations - Array of split calculations
 * @returns Array of settlement transactions
 */
export function calculateSettlements(
  calculations: SplitCalculation[]
): SettlementTransaction[] {
  const settlements: SettlementTransaction[] = [];
  const epsilon = 0.01; // Threshold for floating point comparison

  // Separate creditors (owed money) and debtors (owe money)
  const creditors = calculations
    .filter(c => c.balance > epsilon)
    .map(c => ({ name: c.name, amount: c.balance }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = calculations
    .filter(c => c.balance < -epsilon)
    .map(c => ({ name: c.name, amount: -c.balance }))
    .sort((a, b) => b.amount - a.amount);

  // Greedy algorithm: match largest debtor with largest creditor
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    const settleAmount = Math.min(creditor.amount, debtor.amount);

    if (settleAmount > epsilon) {
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: settleAmount,
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount < epsilon) {
      creditorIndex++;
    }
    if (debtor.amount < epsilon) {
      debtorIndex++;
    }
  }

  return settlements;
}
