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
    // Return default fallback
    return {
      Food: '#f59e0b',
      Transport: '#3b82f6',
      Shopping: '#ec4899',
      Entertainment: '#8b5cf6',
      Bills: '#ef4444',
      Health: '#10b981',
      Other: '#6b7280',
    };
  }
}
