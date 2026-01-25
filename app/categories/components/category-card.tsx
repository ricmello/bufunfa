import { Category } from '@/lib/types/category';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${category.color}20` }}>
            <span className="text-2xl">{category.icon}</span>
          </div>
          <div>
            <CardTitle className="text-lg">{category.name}</CardTitle>
            <CardDescription className="text-sm mt-1">{category.hint}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Subcategories:</p>
          <div className="flex flex-wrap gap-2">
            {category.subcategories.map((subcategory) => (
              <Badge key={subcategory._id} variant="outline">
                {subcategory.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
