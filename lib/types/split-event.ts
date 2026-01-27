export interface Participant {
  id: string; // UUID v4
  name: string;
  weight: number; // 1.0 for couple, 0.5 for single
  isPayer: boolean; // true for host/payer
  amountPaid: number;
}

export interface SplitEvent {
  _id?: string;
  name: string;
  description: string | null;
  eventDate: Date;
  hostUserId: string; // Auth0 user ID
  status: 'open' | 'settled' | 'cancelled';
  participants: Participant[];
  totalAmount: number; // Cached sum of receipts
  totalWeights: number; // Cached sum of weights
  createdAt: Date;
  updatedAt: Date;
}

export interface EventFilters {
  status?: 'all' | 'open' | 'settled' | 'cancelled';
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedEvents {
  events: SplitEvent[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EventFormData {
  name: string;
  description: string | null;
  eventDate: Date;
  participants: Participant[];
}
