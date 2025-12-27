import type { CalendarEvent, DuplicateGroup } from "@/types";

/**
 * Detects duplicate events that can be merged.
 * Groups events by:
 * 1. Same start time (to the minute)
 * 2. Similar base title (before the attendee name suffix)
 */
export function detectDuplicates(events: CalendarEvent[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];

  // Group events by start time (same minute)
  const byTime = groupBy(events, (e) => e.start.toISOString());

  for (const [, timeEvents] of Object.entries(byTime)) {
    // Need at least 2 events at the same time to have duplicates
    if (timeEvents.length < 2) continue;

    // Group by base title (the part before " - Attendee Name")
    const titleGroups = groupByBaseTitle(timeEvents);

    for (const [baseTitle, duplicates] of Object.entries(titleGroups)) {
      // Need at least 2 events with similar titles
      if (duplicates.length < 2) continue;

      // Extract attendee names from each event's title
      const attendees = duplicates.map((e) =>
        extractAttendeeName(e.title, baseTitle)
      );

      // Build the merged title
      const mergedTitle = buildMergedTitle(baseTitle, attendees);

      groups.push({
        events: duplicates,
        baseTitle,
        mergedTitle,
        attendees,
        startTime: duplicates[0].start,
      });
    }
  }

  // Sort groups by start time
  groups.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return groups;
}

/**
 * Group an array by a key function.
 */
function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of array) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }
  return result;
}

/**
 * Group events by their base title (the part before " - Name").
 * Handles various separator patterns used by Acuity.
 */
function groupByBaseTitle(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const result: Record<string, CalendarEvent[]> = {};

  for (const event of events) {
    const baseTitle = extractBaseTitle(event.title);
    if (!result[baseTitle]) {
      result[baseTitle] = [];
    }
    result[baseTitle].push(event);
  }

  return result;
}

/**
 * Extract the base title from an event title.
 * Acuity format: "Class Name - Attendee Name" or "Class Name: Attendee Name"
 *
 * Examples:
 * - "Nose Work Class - John Smith" → "Nose Work Class"
 * - "Private Lesson: Jane Doe" → "Private Lesson"
 * - "Group Training - Sarah & Max" → "Group Training"
 */
function extractBaseTitle(fullTitle: string): string {
  // Common separators used by scheduling software
  const separators = [" - ", " – ", " — ", ": ", " | "];

  for (const sep of separators) {
    const parts = fullTitle.split(sep);
    if (parts.length >= 2) {
      // Return everything before the last separator
      // This handles "Class Name - Details - Attendee" correctly
      return parts.slice(0, -1).join(sep).trim();
    }
  }

  // No separator found - return full title
  return fullTitle.trim();
}

/**
 * Extract the attendee name from a full title given the base title.
 */
function extractAttendeeName(fullTitle: string, baseTitle: string): string {
  // Remove the base title from the beginning
  let remainder = fullTitle.replace(baseTitle, "").trim();

  // Remove leading separators
  remainder = remainder.replace(/^[-–—:|]\s*/, "");

  return remainder.trim() || "Unknown";
}

/**
 * Build a merged title with attendee count and names.
 *
 * Examples:
 * - "Nose Work Class (4 attendees: John, Sarah, Mike, Lisa)"
 * - "Private Lesson (2 attendees: Jane, Bob)"
 */
function buildMergedTitle(baseTitle: string, attendees: string[]): string {
  const count = attendees.length;
  const names = attendees.join(", ");
  return `${baseTitle} (${count} attendees: ${names})`;
}

/**
 * Allow user to customize the merged title format.
 */
export function formatMergedTitle(
  baseTitle: string,
  attendees: string[],
  format: "full" | "count-only" | "names-only" = "full"
): string {
  switch (format) {
    case "count-only":
      return `${baseTitle} (${attendees.length} attendees)`;
    case "names-only":
      return `${baseTitle} - ${attendees.join(", ")}`;
    case "full":
    default:
      return buildMergedTitle(baseTitle, attendees);
  }
}
