'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CategoryFormDialog } from './category-form-dialog';

export function CreateCategoryButton() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button onClick={() => setShowDialog(true)}>
        <Plus className="h-4 w-4 mr-2" />
        New Category
      </Button>

      <CategoryFormDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
      />
    </>
  );
}
