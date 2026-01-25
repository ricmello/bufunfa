import { Collection } from 'mongodb';
import { getDatabase } from './mongodb';
import { Category } from '../types/category';

export async function getCategoriesCollection(): Promise<Collection<Category>> {
  const db = await getDatabase();
  return db.collection<Category>('categories');
}

export async function ensureCategoryIndexes(): Promise<void> {
  const categories = await getCategoriesCollection();
  await categories.createIndex({ name: 1 }, { unique: true });
}

export async function seedDefaultCategories(): Promise<void> {
  const collection = await getCategoriesCollection();
  const count = await collection.countDocuments();

  if (count === 0) {
    const defaults = [
      {
        name: 'Food',
        color: '#f59e0b',
        hint: 'Restaurants, grocery stores, cafes, food delivery',
        icon: 'UtensilsCrossed',
        isDefault: true,
        order: 1,
      },
      {
        name: 'Transport',
        color: '#3b82f6',
        hint: 'Gas, public transit, ride-sharing, parking',
        icon: 'Car',
        isDefault: true,
        order: 2,
      },
      {
        name: 'Shopping',
        color: '#ec4899',
        hint: 'Retail, online shopping, clothing, electronics',
        icon: 'ShoppingBag',
        isDefault: true,
        order: 3,
      },
      {
        name: 'Entertainment',
        color: '#8b5cf6',
        hint: 'Movies, streaming, games, events',
        icon: 'Tv',
        isDefault: true,
        order: 4,
      },
      {
        name: 'Bills',
        color: '#ef4444',
        hint: 'Utilities, phone, internet, insurance',
        icon: 'FileText',
        isDefault: true,
        order: 5,
      },
      {
        name: 'Health',
        color: '#10b981',
        hint: 'Medical, pharmacy, fitness, wellness',
        icon: 'Heart',
        isDefault: true,
        order: 6,
      },
      {
        name: 'Other',
        color: '#6b7280',
        hint: 'Miscellaneous expenses',
        icon: 'MoreHorizontal',
        isDefault: true,
        order: 7,
      },
    ];

    await collection.insertMany(
      defaults.map((d) => ({
        ...d,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );

    await ensureCategoryIndexes();

    console.log('✅ Seeded default categories');
  }
}
