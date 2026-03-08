import type { CalendarEvent, DuplicateGroup, MergeResult, SeriesGroup, SeriesMergeResult } from "@/types";
import { createEvent, createRecurringEvent, getCalendarTimeZone, markEventAsMerged } from "./google-calendar";

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
 * Detect a regular interval between sorted dates and build an RRULE.
 * Returns e.g. ["RRULE:FREQ=WEEKLY;COUNT=5"] for weekly patterns.
 * Returns null if dates don't follow a uniform pattern (fallback to individual events).
 * Returns null if only 1 date (no recurrence needed).
 */
function buildRecurrence(sortedDates: Date[]): string[] | null {
  if (sortedDates.length <= 1) return null;

  // Calculate intervals between consecutive dates in days
  const intervalDays: number[] = [];
  for (let i = 1; i < sortedDates.length; i++) {
    const diffMs = sortedDates[i].getTime() - sortedDates[i - 1].getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
    intervalDays.push(days);
  }

  // Check all intervals are the same
  const interval = intervalDays[0];
  if (!intervalDays.every((d) => d === interval)) return null;

  // Map interval to RRULE frequency
  if (interval === 7) {
    return [`RRULE:FREQ=WEEKLY;COUNT=${sortedDates.length}`];
  } else if (interval === 14) {
    return [`RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=${sortedDates.length}`];
  } else if (interval === 1) {
    return [`RRULE:FREQ=DAILY;COUNT=${sortedDates.length}`];
  } else if (interval % 7 === 0) {
    return [`RRULE:FREQ=WEEKLY;INTERVAL=${interval / 7};COUNT=${sortedDates.length}`];
  }

  return null;
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
    // Fetch the calendar timezone once — avoids N redundant API calls when
    // creating individual events in an irregular series.
    const timeZone = await getCalendarTimeZone(accessToken, targetCalendarId);

    const recurrence = buildRecurrence(sortedDates);
    const createdEventIds: string[] = [];

    const eventData = {
      title: mergedTitle,
      description: descriptionLines.join("\n"),
      start: anchorEvent.start,
      end: anchorEvent.end,
      allDay: anchorEvent.allDay,
    };

    if (recurrence) {
      // Dates follow a regular pattern — create a single RRULE recurring event
      const id = await createRecurringEvent(
        accessToken,
        targetCalendarId,
        eventData,
        recurrence,
        timeZone
      );
      createdEventIds.push(id);
    } else {
      // Irregular dates — create individual events per date
      const duration = anchorEvent.end.getTime() - anchorEvent.start.getTime();

      const results = await Promise.allSettled(
        sortedDateStrs.map((dateStr) => {
          const group = series.eventsByDate[dateStr];
          const dateAnchor = group.events[0];
          return createEvent(accessToken, targetCalendarId, {
            ...eventData,
            start: dateAnchor.start,
            end: new Date(dateAnchor.start.getTime() + duration),
          }, timeZone);
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled") createdEventIds.push(r.value);
      }

      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        console.error(`Failed to create ${failed}/${sortedDateStrs.length} individual series events`);
      }
    }

    return {
      success: true,
      createdEventIds,
      mergedDates: sortedDates.length,
      totalEventsProcessed: series.allEvents.length,
      markedCount: 0,
    };
  } catch (error) {
    return {
      success: false,
      createdEventIds: [],
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
