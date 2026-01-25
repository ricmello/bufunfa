import { Suspense } from 'react';
import { CategoryList } from './components/category-list';
import { Skeleton } from '@/components/ui/skeleton';

export default function CategoriesPage() {
  return (
    <div className="container max-w-4xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground mt-2">
          Browse expense categories and subcategories used for AI categorization. Categories are
          read-only and seeded from the database.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-96" />}>
        <CategoryList />
      </Suspense>
    </div>
  );
}
