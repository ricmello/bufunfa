'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { uploadReceipt } from '@/lib/actions/receipts';
import type { Participant } from '@/lib/types/split-event';

interface ReceiptUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId: string;
  participants: Participant[];
}

export function ReceiptUploadDialog({
  open,
  onClose,
  onSuccess,
  eventId,
  participants,
}: ReceiptUploadDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [description, setDescription] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!paidBy) {
      toast.error('Please select who paid');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    if (selectedFile) {
      formData.append('image', selectedFile);
    }
    formData.append('description', description.trim());
    formData.append('merchantName', merchantName.trim());
    formData.append('amount', amountValue.toString());
    formData.append('paidBy', paidBy);

    const result = await uploadReceipt(eventId, formData);

    if (result.success) {
      toast.success('Receipt uploaded successfully');
      handleClose();
      onSuccess();
    } else {
      toast.error(result.error || 'Failed to upload receipt');
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    setDescription('');
    setMerchantName('');
    setAmount('');
    setPaidBy('');
    setSelectedFile(null);
    setPreviewUrl(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Receipt</DialogTitle>
          <DialogDescription>
            Enter receipt details. Photo is optional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image">Receipt Image (Optional)</Label>
            {!previewUrl ? (
              <label
                htmlFor="image"
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 transition-colors hover:border-muted-foreground/50 hover:bg-muted"
              >
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to select an image (optional)
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  JPEG, PNG, or WebP (max 5MB)
                </span>
              </label>
            ) : (
              <div className="relative">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Input
              id="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Carne, Bebidas, Carvão"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (R$) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchantName">Merchant (Optional)</Label>
            <Input
              id="merchantName"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="e.g., Açougue, Mercado"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidBy">Paid By *</Label>
            <Select value={paidBy} onValueChange={setPaidBy} required>
              <SelectTrigger id="paidBy">
                <SelectValue placeholder="Select who paid" />
              </SelectTrigger>
              <SelectContent>
                {participants.map((participant) => (
                  <SelectItem key={participant.id} value={participant.id}>
                    {participant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Receipt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
