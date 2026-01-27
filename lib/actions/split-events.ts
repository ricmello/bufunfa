'use server';

import { ObjectId } from 'mongodb';
import { randomUUID } from 'crypto';
import { auth0 } from '../auth0';
import { getEventsCollection } from '../db/collections';
import type { EventFilters, PaginatedEvents, EventFormData } from '../types/split-event';

/**
 * Get paginated list of events with filters
 */
export async function getEvents(
  filters: EventFilters = {}
): Promise<PaginatedEvents> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return { events: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };
    }

    const collection = await getEventsCollection();
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;

    // Build match query
    const match: any = { hostUserId: session.user.sub };

    if (filters.status && filters.status !== 'all') {
      match.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      match.eventDate = {};
      if (filters.dateFrom) {
        match.eventDate.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        match.eventDate.$lte = filters.dateTo;
      }
    }

    if (filters.search) {
      match.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Use $facet for count + data in single query
    const result = await collection
      .aggregate([
        { $match: match },
        {
          $facet: {
            metadata: [{ $count: 'totalCount' }],
            data: [
              { $sort: { eventDate: -1, createdAt: -1 } },
              { $skip: (page - 1) * pageSize },
              { $limit: pageSize },
            ],
          },
        },
      ])
      .toArray();

    const totalCount = result[0]?.metadata[0]?.totalCount || 0;
    const events = result[0]?.data || [];

    // Transform: ObjectId → string, Date → Date
    const transformedEvents = events.map((e: any) => ({
      ...e,
      _id: e._id.toString(),
      eventDate: new Date(e.eventDate),
      createdAt: new Date(e.createdAt),
      updatedAt: new Date(e.updatedAt),
    }));

    return {
      events: transformedEvents,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } catch (error) {
    console.error('Error in getEvents:', error);
    return { events: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };
  }
}

/**
 * Get event by ID
 */
export async function getEventById(
  eventId: string
): Promise<{ success: boolean; event?: any; error?: string }> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const collection = await getEventsCollection();
    const event = await collection.findOne({
      _id: new ObjectId(eventId),
      hostUserId: session.user.sub,
    } as any);

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    // Transform: ObjectId → string, Date → Date
    const transformedEvent = {
      ...event,
      _id: event._id.toString(),
      eventDate: new Date(event.eventDate),
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt),
    };

    return { success: true, event: transformedEvent };
  } catch (error) {
    console.error('Error in getEventById:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create new event
 */
export async function createEvent(
  data: EventFormData
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    // Validate
    if (!data.name || data.name.trim().length === 0) {
      return { success: false, error: 'Event name is required' };
    }

    if (!data.participants || data.participants.length < 2) {
      return { success: false, error: 'At least 2 participants required' };
    }

    const payers = data.participants.filter(p => p.isPayer);
    if (payers.length !== 1) {
      return { success: false, error: 'Exactly one payer is required' };
    }

    // Get session
    const session = await auth0.getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Calculate totals
    const totalWeights = data.participants.reduce((sum, p) => sum + p.weight, 0);

    // Ensure each participant has an ID
    const participantsWithIds = data.participants.map(p => ({
      ...p,
      id: p.id || randomUUID(),
      amountPaid: p.isPayer ? 0 : 0, // Initialize to 0, will be updated when receipts are added
    }));

    // Insert
    const collection = await getEventsCollection();
    const result = await collection.insertOne({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      eventDate: new Date(data.eventDate),
      hostUserId: session.user.sub,
      status: 'open',
      participants: participantsWithIds,
      totalAmount: 0, // No receipts yet
      totalWeights,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true, eventId: result.insertedId.toString() };
  } catch (error) {
    console.error('Error in createEvent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update event
 */
export async function updateEvent(
  eventId: string,
  data: EventFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate
    if (!data.name || data.name.trim().length === 0) {
      return { success: false, error: 'Event name is required' };
    }

    if (!data.participants || data.participants.length < 2) {
      return { success: false, error: 'At least 2 participants required' };
    }

    const payers = data.participants.filter(p => p.isPayer);
    if (payers.length !== 1) {
      return { success: false, error: 'Exactly one payer is required' };
    }

    // Get session
    const session = await auth0.getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const collection = await getEventsCollection();

    // Verify ownership
    const existing = await collection.findOne({
      _id: new ObjectId(eventId),
      hostUserId: session.user.sub,
    } as any);

    if (!existing) {
      return { success: false, error: 'Event not found or unauthorized' };
    }

    // Calculate totals
    const totalWeights = data.participants.reduce((sum, p) => sum + p.weight, 0);

    // Preserve participant IDs if they exist, or generate new ones
    const participantsWithIds = data.participants.map(p => ({
      ...p,
      id: p.id || randomUUID(),
    }));

    // Update
    await collection.updateOne(
      { _id: new ObjectId(eventId) } as any,
      {
        $set: {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          eventDate: new Date(data.eventDate),
          participants: participantsWithIds,
          totalWeights,
          updatedAt: new Date(),
        },
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error in updateEvent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete event
 */
export async function deleteEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const collection = await getEventsCollection();

    // Delete only if owned by user
    const result = await collection.deleteOne({
      _id: new ObjectId(eventId),
      hostUserId: session.user.sub,
    } as any);

    if (result.deletedCount === 0) {
      return { success: false, error: 'Event not found or unauthorized' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteEvent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Export events to CSV
 */
export async function exportEventsToCSV(
  filters: EventFilters = {}
): Promise<{ success: boolean; csv?: string; error?: string }> {
  try {
    const result = await getEvents({ ...filters, page: 1, pageSize: 10000 });

    if (result.events.length === 0) {
      return { success: false, error: 'No events to export' };
    }

    // Escape CSV values
    const escape = (val: any): string => {
      const str = String(val ?? '');
      return str.includes('"') || str.includes(',')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    // Headers
    const headers = [
      'Event Name',
      'Description',
      'Event Date',
      'Status',
      'Total Amount',
      'Participants Count',
      'Created At',
    ];

    // Rows
    const rows = result.events.map(e => [
      escape(e.name),
      escape(e.description || ''),
      escape(e.eventDate.toISOString().split('T')[0]),
      escape(e.status),
      escape(e.totalAmount.toFixed(2)),
      escape(e.participants.length),
      escape(e.createdAt.toISOString()),
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join(
      '\n'
    );

    return { success: true, csv };
  } catch (error) {
    console.error('Error in exportEventsToCSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
