'use client';

import { useState, useTransition } from 'react';
import { updatePIXSettings } from '@/lib/actions/split-events';
import { validatePIXKey } from '@/lib/utils/pix-generator';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PIXSettingsDialogProps {
  eventId: string;
  currentPixKey?: string | null;
  currentPixName?: string | null;
  onUpdate: () => void;
}

export function PIXSettingsDialog({
  eventId,
  currentPixKey,
  currentPixName,
  onUpdate,
}: PIXSettingsDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [pixKey, setPixKey] = useState(currentPixKey || '');
  const [pixName, setPixName] = useState(currentPixName || '');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);

    // Validate PIX key if provided
    if (pixKey.trim()) {
      const validation = validatePIXKey(pixKey);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid PIX key');
        return;
      }
    }

    // Validate PIX name if key is provided
    if (pixKey.trim() && !pixName.trim()) {
      setError('Recipient name is required when PIX key is provided');
      return;
    }

    startTransition(async () => {
      const result = await updatePIXSettings(
        eventId,
        pixKey.trim() || null,
        pixName.trim() || null
      );

      if (result.success) {
        toast({
          title: 'PIX settings saved',
          description: 'Your PIX payment details have been updated.',
        });
        setOpen(false);
        onUpdate();
      } else {
        setError(result.error || 'Failed to save PIX settings');
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset form when opening
      setPixKey(currentPixKey || '');
      setPixName(currentPixName || '');
      setError(null);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          PIX Settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>PIX Payment Settings</DialogTitle>
          <DialogDescription>
            Configure PIX details for receiving payments. This information will be used to generate QR codes in shareable links.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pixKey">PIX Key</Label>
            <Input
              id="pixKey"
              placeholder="CPF, email, phone, or random key"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Examples: 123.456.789-00 (CPF), email@example.com, +5511987654321
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pixName">Recipient Name</Label>
            <Input
              id="pixName"
              placeholder="Full name as registered"
              value={pixName}
              onChange={(e) => setPixName(e.target.value)}
              disabled={isPending}
              maxLength={25}
            />
            <p className="text-xs text-muted-foreground">
              Maximum 25 characters (PIX standard limit)
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertDescription className="text-xs">
              PIX details are optional. If not configured, shareable links will still work but won't include QR codes for payment.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
