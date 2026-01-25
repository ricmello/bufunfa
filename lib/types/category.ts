export interface Subcategory {
  _id: string; // ObjectId as string
  name: string;
}

export interface Category {
  _id?: string; // ObjectId as string
  name: string; // Unique category name (e.g., "Food & Groceries")
  color: string; // Hex color code (#f59e0b)
  hint: string; // AI categorization hint
  icon: string; // Emoji icon (🍔)
  order: number; // Display sort order
  subcategories: Subcategory[]; // Nested subcategories
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryInsert extends Omit<Category, '_id' | 'createdAt' | 'updatedAt'> {
  createdAt?: Date;
  updatedAt?: Date;
}
