'use server';

import { getCategoriesCollection } from '../db/categories';
import type { Category } from '../types/category';

/**
 * Get all categories with their subcategories
 * Categories are read-only and seeded from database
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    const collection = await getCategoriesCollection();
    const categories = await collection.find({}).sort({ order: 1 }).toArray();

    return categories.map((cat) => ({
      ...cat,
      _id: cat._id!.toString(),
      subcategories: (cat.subcategories || []).map((sub) => ({
        _id: sub._id,
        name: sub.name,
      })),
    }));
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
}

/**
 * Get just the category names (for AI schema validation)
 */
export async function getCategoryNames(): Promise<string[]> {
  try {
    const categories = await getAllCategories();
    return categories.map((c) => c.name);
  } catch (error) {
    console.error('Error getting category names:', error);
    return ['Other']; // Fallback
  }
}
