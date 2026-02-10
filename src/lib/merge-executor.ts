import type { CalendarEvent, DuplicateGroup, MergeResult, SeriesGroup, SeriesMergeResult } from "@/types";
import { createEvent, createRecurringEvent, markEventAsMerged } from "./google-calendar";

/**
 * Execute a merge operation:
 * 1. Create the merged event on the target calendar
 * 2. Return immediately — marking originals is handled by the caller via after()
 */
export async function executeMerge(
  accessToken: string,
  group: DuplicateGroup,
  options: {
    targetCalendarId: string;
    customTitle?: string;
  }
): Promise<MergeResult> {
  const { targetCalendarId, customTitle } = options;
  const firstEvent = group.events[0];

  try {
    const createdEventId = await createEvent(accessToken, targetCalendarId, {
      title: customTitle || group.mergedTitle,
      description: buildMergedDescription(group),
      start: firstEvent.start,
      end: firstEvent.end,
      allDay: firstEvent.allDay,
    });

    return {
      success: true,
      createdEventId,
      markedCount: 0,
    };
  } catch (error) {
    return {
      success: false,
      markedCount: 0,
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
 * Build RDATE recurrence values for dates after the first.
 * Returns e.g. ["RDATE:20241208T191500Z,20241215T191500Z"]
 * Returns empty array if only 1 date (no recurrence needed).
 */
function buildRecurrenceRDates(
  sortedDates: Date[],
  referenceEvent: { start: Date }
): string[] {
  if (sortedDates.length <= 1) return [];

  const refTime = referenceEvent.start;
  const hours = refTime.getUTCHours().toString().padStart(2, "0");
  const minutes = refTime.getUTCMinutes().toString().padStart(2, "0");
  const seconds = refTime.getUTCSeconds().toString().padStart(2, "0");
  const timePart = `T${hours}${minutes}${seconds}Z`;

  const rdateValues = sortedDates.slice(1).map((d) => {
    const year = d.getUTCFullYear();
    const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = d.getUTCDate().toString().padStart(2, "0");
    return `${year}${month}${day}${timePart}`;
  });

  return [`RDATE:${rdateValues.join(",")}`];
}

/**
 * Execute a series merge operation:
 * 1. Create a single recurring event with RDATE rules covering all dates
 * 2. Return immediately — marking originals is handled by the caller via after()
 */
export async function executeSeriesMerge(
  accessToken: string,
  series: SeriesGroup,
  targetCalendarId: string
): Promise<SeriesMergeResult> {
  const sortedDateStrs = Object.keys(series.eventsByDate).sort();
  const sortedDates = sortedDateStrs.map((d) => new Date(d + "T00:00:00Z"));

  const firstGroup = series.eventsByDate[sortedDateStrs[0]];
  const anchorEvent = firstGroup.events[0];

  const descriptionLines = [
    `Recurring series: ${series.baseTitle}`,
    `${series.dates.length} dates | ${series.allAttendees.length} attendees`,
    "",
    "Attendees:",
    ...series.allAttendees.map((name, i) => `  ${i + 1}. ${name}`),
    "",
    "Per-date breakdown:",
    ...sortedDateStrs.map((dateStr) => {
      const group = series.eventsByDate[dateStr];
      const d = new Date(dateStr + "T12:00:00");
      const dateLabel = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      return `  ${dateLabel}: ${group.attendees.join(", ")}`;
    }),
    "",
    `Series dates: ${series.datePattern}`,
    `Merged on: ${new Date().toLocaleDateString()}`,
  ];

  const mergedTitle = `${series.baseTitle} (${series.allAttendees.length} attendees)`;

  try {
    const recurrence = buildRecurrenceRDates(sortedDates, anchorEvent);

    let createdEventId: string;
    const eventData = {
      title: mergedTitle,
      description: descriptionLines.join("\n"),
      start: anchorEvent.start,
      end: anchorEvent.end,
      allDay: anchorEvent.allDay,
    };

    if (recurrence.length > 0) {
      createdEventId = await createRecurringEvent(
        accessToken,
        targetCalendarId,
        eventData,
        recurrence
      );
    } else {
      createdEventId = await createEvent(
        accessToken,
        targetCalendarId,
        eventData
      );
    }

    return {
      success: true,
      createdEventId,
      mergedDates: sortedDates.length,
      totalEventsProcessed: series.allEvents.length,
      markedCount: 0,
    };
  } catch (error) {
    return {
      success: false,
      mergedDates: 0,
      totalEventsProcessed: series.allEvents.length,
      markedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Mark original events as merged in the background.
 * Uses Promise.allSettled for parallel execution.
 */
export async function markOriginals(
  accessToken: string,
  events: CalendarEvent[]
): Promise<void> {
  const results = await Promise.allSettled(
    events.map((event) =>
      markEventAsMerged(accessToken, event.calendarId, event.id)
    )
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error(`Failed to mark ${failed.length}/${events.length} events as merged`);
  }
}
