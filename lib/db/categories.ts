import { Collection, ObjectId } from 'mongodb';
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
        name: 'Food & Groceries',
        color: '#f59e0b',
        hint: 'Supermarkets, restaurants, cafes, food delivery, groceries',
        icon: '🍔',
        order: 1,
        subcategories: [
          { _id: new ObjectId().toString(), name: 'Supermarket' },
          { _id: new ObjectId().toString(), name: 'Restaurant' },
          { _id: new ObjectId().toString(), name: 'Delivery' },
          { _id: new ObjectId().toString(), name: 'Other' },
        ],
      },
      {
        name: 'Transportation',
        color: '#3b82f6',
        hint: 'Ride sharing, public transit, car maintenance, gas, parking',
        icon: '🚗',
        order: 2,
        subcategories: [
          { _id: new ObjectId().toString(), name: 'Ride Share' },
          { _id: new ObjectId().toString(), name: 'Public Transport' },
          { _id: new ObjectId().toString(), name: 'Car Maintenance' },
          { _id: new ObjectId().toString(), name: 'Other' },
        ],
      },
      {
        name: 'Housing',
        color: '#14b8a6',
        hint: 'Rent, mortgage, utilities, condo fees, home maintenance',
        icon: '🏠',
        order: 3,
        subcategories: [
          { _id: new ObjectId().toString(), name: 'Rent/Mortgage' },
          { _id: new ObjectId().toString(), name: 'Utilities' },
          { _id: new ObjectId().toString(), name: 'Condo Fees' },
          { _id: new ObjectId().toString(), name: 'Maintenance' },
          { _id: new ObjectId().toString(), name: 'Other' },
        ],
      },
      {
        name: 'Bills & Subscriptions',
        color: '#ef4444',
        hint: 'Streaming services, software, gym memberships, insurance, bank fees',
        icon: '📄',
        order: 4,
        subcategories: [
          { _id: new ObjectId().toString(), name: 'Streaming' },
          { _id: new ObjectId().toString(), name: 'Software/SaaS' },
          { _id: new ObjectId().toString(), name: 'Gym' },
          { _id: new ObjectId().toString(), name: 'Insurance' },
          { _id: new ObjectId().toString(), name: 'Bank Fees' },
          { _id: new ObjectId().toString(), name: 'Other' },
        ],
      },
      {
        name: 'Entertainment',
        color: '#8b5cf6',
        hint: 'Movies, events, games, hobbies, sports, travel, tourism',
        icon: '🎬',
        order: 5,
        subcategories: [
          { _id: new ObjectId().toString(), name: 'Movies/Events' },
          { _id: new ObjectId().toString(), name: 'Games' },
          { _id: new ObjectId().toString(), name: 'Books/Hobbies' },
          { _id: new ObjectId().toString(), name: 'Sports/Activities' },
          { _id: new ObjectId().toString(), name: 'Travel/Tourism' },
          { _id: new ObjectId().toString(), name: 'Other' },
        ],
      },
      {
        name: 'Shopping',
        color: '#ec4899',
        hint: 'Clothing, shoes, electronics, personal care, home goods, gifts',
        icon: '🛍️',
        order: 6,
        subcategories: [
          { _id: new ObjectId().toString(), name: 'Clothing/Shoes' },
          { _id: new ObjectId().toString(), name: 'Electronics' },
          { _id: new ObjectId().toString(), name: 'Personal Care' },
          { _id: new ObjectId().toString(), name: 'Home Goods' },
          { _id: new ObjectId().toString(), name: 'Gifts' },
          { _id: new ObjectId().toString(), name: 'Other' },
        ],
      },
      {
        name: 'Health',
        color: '#10b981',
        hint: 'Pharmacy, medical appointments, hospital, health insurance',
        icon: '💊',
        order: 7,
        subcategories: [
          { _id: new ObjectId().toString(), name: 'Pharmacy' },
          { _id: new ObjectId().toString(), name: 'Hospital/Doctor' },
          { _id: new ObjectId().toString(), name: 'Insurance' },
          { _id: new ObjectId().toString(), name: 'Other' },
        ],
      },
      {
        name: 'Education',
        color: '#f97316',
        hint: 'Courses, certifications, books, educational materials',
        icon: '📚',
        order: 8,
        subcategories: [
          { _id: new ObjectId().toString(), name: 'Courses/Certifications' },
          { _id: new ObjectId().toString(), name: 'Books/Materials' },
          { _id: new ObjectId().toString(), name: 'Other' },
        ],
      },
      {
        name: 'Work',
        color: '#0ea5e9',
        hint: 'Work equipment, professional services, business travel',
        icon: '💼',
        order: 9,
        subcategories: [
          { _id: new ObjectId().toString(), name: 'Equipment' },
          { _id: new ObjectId().toString(), name: 'Services' },
          { _id: new ObjectId().toString(), name: 'Business Travel' },
          { _id: new ObjectId().toString(), name: 'Other' },
        ],
      },
      {
        name: 'Financial',
        color: '#a855f7',
        hint: 'Investments, savings, loans, debt payments, taxes',
        icon: '💰',
        order: 10,
        subcategories: [
          { _id: new ObjectId().toString(), name: 'Investments/Savings' },
          { _id: new ObjectId().toString(), name: 'Loans/Debt' },
          { _id: new ObjectId().toString(), name: 'Taxes' },
          { _id: new ObjectId().toString(), name: 'Other' },
        ],
      },
      {
        name: 'Other',
        color: '#6b7280',
        hint: 'Cash withdrawals, uncategorized, miscellaneous expenses',
        icon: '📦',
        order: 11,
        subcategories: [
          { _id: new ObjectId().toString(), name: 'Cash Withdrawal' },
          { _id: new ObjectId().toString(), name: 'Uncategorized' },
          { _id: new ObjectId().toString(), name: 'Other' },
        ],
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

    console.log('✅ Seeded 11 default categories with subcategories');
  }
}
