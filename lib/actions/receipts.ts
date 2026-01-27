'use server';

import { ObjectId } from 'mongodb';
import { randomUUID } from 'crypto';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { auth0 } from '../auth0';
import { getReceiptsCollection, getEventsCollection } from '../db/collections';
import type { Receipt } from '../types/receipt';

/**
 * Get all receipts for an event
 */
export async function getReceipts(eventId: string): Promise<Receipt[]> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return [];
    }

    // Verify event ownership
    const eventsCollection = await getEventsCollection();
    const event = await eventsCollection.findOne({
      _id: new ObjectId(eventId),
      hostUserId: session.user.sub,
    } as any);

    if (!event) {
      return [];
    }

    const receiptsCollection = await getReceiptsCollection();
    const receipts = await receiptsCollection
      .find({ eventId })
      .sort({ createdAt: -1 })
      .toArray();

    return receipts.map((r) => ({
      ...r,
      _id: r._id?.toString(),
      createdAt: r.createdAt || new Date(),
      updatedAt: r.updatedAt || new Date(),
    }));
  } catch (error) {
    console.error('Error in getReceipts:', error);
    return [];
  }
}

/**
 * Upload a receipt with image
 */
export async function uploadReceipt(
  eventId: string,
  formData: FormData
): Promise<{ success: boolean; receiptId?: string; error?: string }> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify event ownership
    const eventsCollection = await getEventsCollection();
    const event = await eventsCollection.findOne({
      _id: new ObjectId(eventId),
      hostUserId: session.user.sub,
    } as any);

    if (!event) {
      return { success: false, error: 'Unauthorized' };
    }

    // Extract and validate form data
    const image = formData.get('image') as File | null;
    const description = formData.get('description') as string;
    const merchantName = (formData.get('merchantName') as string) || null;
    const amount = parseFloat(formData.get('amount') as string);
    const paidBy = formData.get('paidBy') as string;

    if (!description || !amount || !paidBy) {
      return { success: false, error: 'Missing required fields' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' };
    }

    // Validate image if provided
    if (image && image.size > 0) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(image.type)) {
        return { success: false, error: 'Invalid image type. Only JPEG, PNG, and WebP are allowed.' };
      }

      const maxSize = 5 * 1024 * 1024;
      if (image.size > maxSize) {
        return { success: false, error: 'Image must be less than 5MB' };
      }
    }

    // Verify participant exists
    const participant = event.participants.find((p) => p.id === paidBy);
    if (!participant) {
      return { success: false, error: 'Invalid participant' };
    }

    // Handle image upload if provided
    let imageUrl: string | null = null;
    let imageMimeType: string | null = null;

    if (image && image.size > 0) {
      const receiptId = randomUUID();
      const extension = image.type === 'image/jpeg' ? 'jpg' : image.type === 'image/png' ? 'png' : 'webp';

      // Create upload directory if it doesn't exist
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'split-bills', 'receipts', eventId);
      await mkdir(uploadDir, { recursive: true });

      // Save image to filesystem
      const filename = `${receiptId}.${extension}`;
      const filepath = join(uploadDir, filename);
      const buffer = Buffer.from(await image.arrayBuffer());
      await writeFile(filepath, buffer);

      imageUrl = `/uploads/split-bills/receipts/${eventId}/${filename}`;
      imageMimeType = image.type;
    }

    // Save receipt to database
    const receiptsCollection = await getReceiptsCollection();
    const receiptId = randomUUID();
    await receiptsCollection.insertOne({
      eventId,
      description,
      merchantName,
      amount,
      paidBy,
      imageUrl,
      imageMimeType,
      uploadedBy: session.user.sub,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    // Update event's totalAmount and participant's amountPaid
    await updateEventTotalAmount(eventId);

    return { success: true, receiptId };
  } catch (error) {
    console.error('Error in uploadReceipt:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload receipt',
    };
  }
}

/**
 * Delete a receipt and its image file
 */
export async function deleteReceipt(
  receiptId: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify event ownership
    const eventsCollection = await getEventsCollection();
    const event = await eventsCollection.findOne({
      _id: new ObjectId(eventId),
      hostUserId: session.user.sub,
    } as any);

    if (!event) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get receipt to find image path
    const receiptsCollection = await getReceiptsCollection();
    const receipt = await receiptsCollection.findOne({
      _id: new ObjectId(receiptId),
      eventId,
    } as any);

    if (!receipt) {
      return { success: false, error: 'Receipt not found' };
    }

    // Delete image file from filesystem
    if (receipt.imageUrl) {
      const filepath = join(process.cwd(), 'public', receipt.imageUrl);
      if (existsSync(filepath)) {
        await unlink(filepath);
      }
    }

    // Delete receipt from database
    await receiptsCollection.deleteOne({ _id: new ObjectId(receiptId) } as any);

    // Update event's totalAmount and participant's amountPaid
    await updateEventTotalAmount(eventId);

    return { success: true };
  } catch (error) {
    console.error('Error in deleteReceipt:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete receipt',
    };
  }
}

/**
 * Recalculate event's totalAmount and participants' amountPaid based on receipts
 */
export async function updateEventTotalAmount(eventId: string): Promise<void> {
  try {
    const receiptsCollection = await getReceiptsCollection();
    const eventsCollection = await getEventsCollection();

    // Get all receipts for the event
    const receipts = await receiptsCollection.find({ eventId }).toArray();

    // Calculate total amount
    const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);

    // Calculate each participant's total paid
    const paidByParticipant = new Map<string, number>();
    for (const receipt of receipts) {
      const current = paidByParticipant.get(receipt.paidBy) || 0;
      paidByParticipant.set(receipt.paidBy, current + receipt.amount);
    }

    // Get current event
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) } as any);
    if (!event) {
      return;
    }

    // Update participants' amountPaid
    const updatedParticipants = event.participants.map((p) => ({
      ...p,
      amountPaid: paidByParticipant.get(p.id) || 0,
    }));

    // Update event with new totals
    await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) } as any,
      {
        $set: {
          totalAmount,
          participants: updatedParticipants,
          updatedAt: new Date(),
        },
      }
    );
  } catch (error) {
    console.error('Error in updateEventTotalAmount:', error);
  }
}
