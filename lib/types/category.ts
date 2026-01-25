export interface Category {
  _id?: string;
  name: string; // Unique category name
  color: string; // Hex color code (#f59e0b)
  hint: string | null; // AI categorization hint
  icon: string; // Lucide icon name
  isDefault: boolean; // true for system categories
  order: number; // Sort order
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryInsert extends Omit<Category, '_id' | 'createdAt' | 'updatedAt'> {
  createdAt?: Date;
  updatedAt?: Date;
}
