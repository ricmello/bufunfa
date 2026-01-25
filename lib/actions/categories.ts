'use server';

import { getCategoriesCollection } from '../db/categories';
import { Category } from '../types/category';
import { ObjectId } from 'mongodb';
import { getExpensesCollection } from '../db/collections';

export async function getAllCategories(): Promise<Category[]> {
  try {
    const collection = await getCategoriesCollection();
    const categories = await collection.find({}).sort({ order: 1 }).toArray();
    return categories.map((cat) => ({ ...cat, _id: cat._id!.toString() }));
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
}

export async function getCategoryNames(): Promise<string[]> {
  try {
    const categories = await getAllCategories();
    return categories.map((c) => c.name);
  } catch (error) {
    console.error('Error getting category names:', error);
    return ['Other']; // Fallback
  }
}

export async function createCategory(data: {
  name: string;
  color: string;
  hint: string | null;
  icon: string;
}): Promise<{ success: boolean; error?: string; category?: Category }> {
  try {
    const collection = await getCategoriesCollection();

    // Check duplicate
    const existing = await collection.findOne({ name: data.name });
    if (existing) {
      return { success: false, error: 'Category name already exists' };
    }

    // Get max order
    const maxOrderDoc = await collection.find({}).sort({ order: -1 }).limit(1).toArray();
    const maxOrder = maxOrderDoc[0]?.order ?? 0;

    const now = new Date();
    const category = {
      ...data,
      isDefault: false,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(category as any);

    return {
      success: true,
      category: { ...category, _id: result.insertedId.toString() },
    };
  } catch (error) {
    console.error('Error creating category:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create category',
    };
  }
}

export async function updateCategory(
  id: string,
  data: Partial<Pick<Category, 'name' | 'color' | 'hint' | 'icon'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const collection = await getCategoriesCollection();

    const result = await collection.updateOne(
      { _id: new ObjectId(id) } as any,
      { $set: { ...data, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: 'Category not found' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating category:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update category',
    };
  }
}

export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const collection = await getCategoriesCollection();

    const category = await collection.findOne({ _id: new ObjectId(id) } as any);
    if (!category) {
      return { success: false, error: 'Category not found' };
    }

    if (category.isDefault) {
      return { success: false, error: 'Cannot delete default categories' };
    }

    // Reassign expenses to "Other"
    const expensesCollection = await getExpensesCollection();
    await expensesCollection.updateMany(
      { category: category.name },
      { $set: { category: 'Other' } }
    );

    await collection.deleteOne({ _id: new ObjectId(id) } as any);

    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete category',
    };
  }
}
