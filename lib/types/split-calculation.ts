export interface SplitCalculation {
  participantId: string;
  name: string;
  weight: number;
  amountPaid: number;
  share: number; // Their proportional share based on weight
  balance: number; // amountPaid - share (positive = owed money, negative = owes money)
}

export interface SettlementTransaction {
  from: string; // Participant name who owes
  to: string; // Participant name who is owed
  amount: number;
}
