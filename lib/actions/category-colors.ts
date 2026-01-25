'use server';

import { getAllCategories } from './categories';

export interface CategoryColorMap {
  [categoryName: string]: string;
}

export async function getCategoryColorMap(): Promise<CategoryColorMap> {
  try {
    const categories = await getAllCategories();

    const colorMap: CategoryColorMap = {};

    categories.forEach((category) => {
      colorMap[category.name] = category.color;
    });

    // Fallback color for uncategorized
    colorMap['Other'] = '#6b7280';

    return colorMap;
  } catch (error) {
    console.error('Error fetching category colors:', error);
    // Return default fallback matching seeded categories
    return {
      'Food & Groceries': '#f59e0b',
      Transportation: '#3b82f6',
      Housing: '#14b8a6',
      'Bills & Subscriptions': '#ef4444',
      Entertainment: '#8b5cf6',
      Shopping: '#ec4899',
      Health: '#10b981',
      Education: '#f97316',
      Work: '#0ea5e9',
      Financial: '#a855f7',
      Other: '#6b7280',
    };
  }
}
