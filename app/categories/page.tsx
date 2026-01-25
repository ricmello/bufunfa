import { Suspense } from 'react';
import { CategoryList } from './components/category-list';
import { CreateCategoryButton } from './components/create-category-button';
import { Skeleton } from '@/components/ui/skeleton';

export default function CategoriesPage() {
  return (
    <div className="container max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-2">
            Manage expense categories and categorization hints for AI
          </p>
        </div>
        <CreateCategoryButton />
      </div>

      <Suspense fallback={<Skeleton className="h-96" />}>
        <CategoryList />
      </Suspense>
    </div>
  );
}
