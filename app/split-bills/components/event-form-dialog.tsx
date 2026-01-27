'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createEvent, updateEvent } from '@/lib/actions/split-events';
import type { SplitEvent, EventFormData, Participant } from '@/lib/types/split-event';

interface EventFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingEvent: SplitEvent | null;
}

export function EventFormDialog({
  open,
  onClose,
  onSuccess,
  editingEvent,
}: EventFormDialogProps) {
  const isEditMode = !!editingEvent;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: crypto.randomUUID(),
      name: '',
      weight: 1.0,
      isPayer: true,
      amountPaid: 0,
    },
    {
      id: crypto.randomUUID(),
      name: '',
      weight: 1.0,
      isPayer: false,
      amountPaid: 0,
    },
  ]);

  // Pre-populate form when editing
  useEffect(() => {
    if (editingEvent && open) {
      setName(editingEvent.name);
      setDescription(editingEvent.description || '');
      setEventDate(
        new Date(editingEvent.eventDate).toISOString().split('T')[0]
      );
      setParticipants(editingEvent.participants);
    } else if (!editingEvent && open) {
      // Reset form for add mode
      setName('');
      setDescription('');
      setEventDate(new Date().toISOString().split('T')[0]);
      setParticipants([
        {
          id: crypto.randomUUID(),
          name: '',
          weight: 1.0,
          isPayer: true,
          amountPaid: 0,
        },
        {
          id: crypto.randomUUID(),
          name: '',
          weight: 1.0,
          isPayer: false,
          amountPaid: 0,
        },
      ]);
    }
  }, [editingEvent, open]);

  const handleAddParticipant = () => {
    setParticipants([
      ...participants,
      {
        id: crypto.randomUUID(),
        name: '',
        weight: 1.0,
        isPayer: false,
        amountPaid: 0,
      },
    ]);
  };

  const handleRemoveParticipant = (index: number) => {
    if (participants.length <= 2) {
      toast.error('At least 2 participants are required');
      return;
    }
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleUpdateParticipant = (
    index: number,
    field: keyof Participant,
    value: any
  ) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };

    // If setting isPayer to true, unset all others
    if (field === 'isPayer' && value === true) {
      updated.forEach((p, i) => {
        if (i !== index) {
          p.isPayer = false;
        }
      });
    }

    setParticipants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!name.trim()) {
      toast.error('Event name is required');
      return;
    }

    if (participants.length < 2) {
      toast.error('At least 2 participants are required');
      return;
    }

    if (participants.some((p) => !p.name.trim())) {
      toast.error('All participants must have a name');
      return;
    }

    const payers = participants.filter((p) => p.isPayer);
    if (payers.length !== 1) {
      toast.error('Exactly one payer is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData: EventFormData = {
        name: name.trim(),
        description: description.trim() || null,
        eventDate: new Date(eventDate),
        participants,
      };

      const result = isEditMode
        ? await updateEvent(editingEvent._id!, formData)
        : await createEvent(formData);

      if (result.success) {
        toast.success(
          isEditMode
            ? 'Event updated successfully'
            : 'Event created successfully'
        );
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to save event');
      }
    } catch (error) {
      toast.error('An error occurred while saving');
      console.error('Error saving event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Event' : 'Create Event'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update event details and participants'
              : 'Create a new event and add participants'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Churrasco Casa do Ricardo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Casual BBQ with friends"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Participants (min. 2)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddParticipant}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Participant
              </Button>
            </div>

            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className="flex gap-2 items-start p-3 border rounded-lg bg-muted/50"
                >
                  {/* Name */}
                  <div className="flex-1">
                    <Input
                      value={participant.name}
                      onChange={(e) =>
                        handleUpdateParticipant(index, 'name', e.target.value)
                      }
                      placeholder="Name"
                      required
                    />
                  </div>

                  {/* Weight */}
                  <div className="w-32">
                    <Select
                      value={participant.weight.toString()}
                      onValueChange={(value) =>
                        handleUpdateParticipant(
                          index,
                          'weight',
                          parseFloat(value)
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.0">Couple (1.0)</SelectItem>
                        <SelectItem value="0.5">Single (0.5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payer Checkbox */}
                  <div className="flex items-center gap-2 pt-2">
                    <Checkbox
                      id={`payer-${participant.id}`}
                      checked={participant.isPayer}
                      onCheckedChange={(checked) =>
                        handleUpdateParticipant(
                          index,
                          'isPayer',
                          checked === true
                        )
                      }
                    />
                    <Label
                      htmlFor={`payer-${participant.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      Payer
                    </Label>
                  </div>

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveParticipant(index)}
                    disabled={participants.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Select one participant as the payer. Weights: Couple = 1.0, Single
              = 0.5
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : isEditMode
                  ? 'Update Event'
                  : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
