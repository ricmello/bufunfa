import { getAllCategories } from '@/lib/actions/categories';
import { CategoryCard } from './category-card';

export async function CategoryList() {
  const categories = await getAllCategories();

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No categories found. Default categories should be seeded automatically.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {categories.map((category) => (
        <CategoryCard key={category._id} category={category} />
      ))}
    </div>
  );
}
