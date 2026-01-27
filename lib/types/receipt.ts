export interface Receipt {
  _id?: string;
  eventId: string;
  description: string;
  merchantName: string | null;
  amount: number;
  paidBy: string;
  imageUrl: string | null;
  imageMimeType: string | null;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReceiptFormData {
  description: string;
  merchantName: string | null;
  amount: number;
  paidBy: string;
  image: File | null;
}
