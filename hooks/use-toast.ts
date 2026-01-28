/**
 * Toast hook wrapper for sonner
 * Provides a compatible API for components that expect useToast()
 */
import { toast as sonnerToast } from 'sonner';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = ({ title, description, variant }: ToastProps) => {
    if (variant === 'destructive') {
      sonnerToast.error(title, {
        description,
      });
    } else {
      sonnerToast(title, {
        description,
      });
    }
  };

  return { toast };
}
