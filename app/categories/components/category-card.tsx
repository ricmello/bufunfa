'use client';

import { Category } from '@/lib/types/category';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CategoryFormDialog } from './category-form-dialog';
import { CategoryDeleteDialog } from './category-delete-dialog';
import * as LucideIcons from 'lucide-react';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Get the icon component dynamically
  const IconComponent = (LucideIcons as any)[category.icon] || LucideIcons.HelpCircle;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <IconComponent className="h-5 w-5" style={{ color: category.color }} />
            </div>
            <div>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              {category.isDefault && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  Default
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEditDialog(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            {!category.isDefault && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm">
            {category.hint || 'No description provided'}
          </CardDescription>
        </CardContent>
      </Card>

      <CategoryFormDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        category={category}
      />

      <CategoryDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        category={category}
      />
    </>
  );
}
