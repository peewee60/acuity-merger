import type { DuplicateGroup, MergeResult } from "@/types";
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
