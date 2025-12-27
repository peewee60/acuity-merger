import type { DuplicateGroup, MergeResult, SeriesGroup, SeriesMergeResult } from "@/types";
import { createEvent, deleteEvent, moveEvent } from "./google-calendar";

/**
 * Execute a merge operation:
 * 1. Create the merged event
 * 2. Move or delete the original events
 */
export async function executeMerge(
  accessToken: string,
  group: DuplicateGroup,
  options: {
    archiveCalendarId?: string;
    customTitle?: string;
  } = {}
): Promise<MergeResult> {
  const { archiveCalendarId, customTitle } = options;

  // Use the first event's calendar as the target
  const targetCalendarId = group.events[0].calendarId;
  const firstEvent = group.events[0];

  try {
    // 1. Create the merged event
    const createdEventId = await createEvent(accessToken, targetCalendarId, {
      title: customTitle || group.mergedTitle,
      description: buildMergedDescription(group),
      start: firstEvent.start,
      end: firstEvent.end,
      allDay: firstEvent.allDay,
    });

    // 2. Handle original events
    let movedCount = 0;
    let deletedCount = 0;

    for (const original of group.events) {
      try {
        if (archiveCalendarId) {
          // Move to archive calendar
          await moveEvent(
            accessToken,
            original.calendarId,
            original.id,
            archiveCalendarId
          );
          movedCount++;
        } else {
          // Delete the original
          await deleteEvent(accessToken, original.calendarId, original.id);
          deletedCount++;
        }
      } catch (error) {
        // If move fails, try to delete instead
        if (archiveCalendarId) {
          try {
            await deleteEvent(accessToken, original.calendarId, original.id);
            deletedCount++;
          } catch {
            // Ignore - event might already be gone
          }
        }
      }
    }

    return {
      success: true,
      createdEventId,
      movedCount,
      deletedCount,
    };
  } catch (error) {
    return {
      success: false,
      movedCount: 0,
      deletedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Build a description for the merged event that lists all original attendees.
 */
function buildMergedDescription(group: DuplicateGroup): string {
  const lines = [
    `Merged from ${group.events.length} individual signups:`,
    "",
    ...group.attendees.map((name, i) => `${i + 1}. ${name}`),
    "",
    `Original class: ${group.baseTitle}`,
    `Merged on: ${new Date().toLocaleDateString()}`,
  ];

  return lines.join("\n");
}

/**
 * Execute a series merge operation:
 * 1. For each date in the series, create a merged event with all attendees for that date
 * 2. Move or delete all original events
 */
export async function executeSeriesMerge(
  accessToken: string,
  series: SeriesGroup,
  options: {
    archiveCalendarId?: string;
  } = {}
): Promise<SeriesMergeResult> {
  const { archiveCalendarId } = options;

  const createdEventIds: string[] = [];
  let movedCount = 0;
  let deletedCount = 0;
  let mergedDates = 0;

  // Use the first event's calendar as the target
  const targetCalendarId = series.allEvents[0].calendarId;

  try {
    // Process each date in the series
    for (const [dateStr, group] of Object.entries(series.eventsByDate)) {
      const firstEvent = group.events[0];

      // Create a merged event for this date
      const createdEventId = await createEvent(accessToken, targetCalendarId, {
        title: group.mergedTitle,
        description: buildSeriesDateDescription(group, series),
        start: firstEvent.start,
        end: firstEvent.end,
        allDay: firstEvent.allDay,
      });

      createdEventIds.push(createdEventId);
      mergedDates++;

      // Handle original events for this date
      for (const original of group.events) {
        try {
          if (archiveCalendarId) {
            await moveEvent(
              accessToken,
              original.calendarId,
              original.id,
              archiveCalendarId
            );
            movedCount++;
          } else {
            await deleteEvent(accessToken, original.calendarId, original.id);
            deletedCount++;
          }
        } catch (error) {
          // If move fails, try to delete instead
          if (archiveCalendarId) {
            try {
              await deleteEvent(accessToken, original.calendarId, original.id);
              deletedCount++;
            } catch {
              // Ignore - event might already be gone
            }
          }
        }
      }
    }

    return {
      success: true,
      createdEventIds,
      mergedDates,
      totalEventsProcessed: series.allEvents.length,
      movedCount,
      deletedCount,
    };
  } catch (error) {
    return {
      success: false,
      createdEventIds,
      mergedDates,
      totalEventsProcessed: series.allEvents.length,
      movedCount,
      deletedCount,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Build a description for a series date merged event.
 */
function buildSeriesDateDescription(group: DuplicateGroup, series: SeriesGroup): string {
  const lines = [
    `Merged from ${group.events.length} individual signups:`,
    "",
    ...group.attendees.map((name, i) => `${i + 1}. ${name}`),
    "",
    `Original class: ${series.baseTitle}`,
    `Series dates: ${series.datePattern}`,
    `Merged on: ${new Date().toLocaleDateString()}`,
  ];

  return lines.join("\n");
}
