import type { CalendarEvent, DuplicateGroup, SeriesGroup } from "@/types";

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
 * Acuity format: "Attendee Name: Class Details"
 *
 * Examples:
 * - "Angela Cook: NOSEWORK FOUNDATION: Mondays..." → "NOSEWORK FOUNDATION: Mondays..."
 * - "Katie Walsh: NOSEWORK FOUNDATION: Mondays..." → "NOSEWORK FOUNDATION: Mondays..."
 */
function extractBaseTitle(fullTitle: string): string {
  // Acuity format: "Attendee Name: Class Details"
  // The attendee name is BEFORE the first colon
  const colonIndex = fullTitle.indexOf(": ");
  if (colonIndex !== -1) {
    // Return everything AFTER the first ": " as the base title
    return fullTitle.slice(colonIndex + 2).trim();
  }

  // Fallback: try other separators at the END (legacy support)
  const separators = [" - ", " – ", " — ", " | "];
  for (const sep of separators) {
    const parts = fullTitle.split(sep);
    if (parts.length >= 2) {
      return parts.slice(0, -1).join(sep).trim();
    }
  }

  return fullTitle.trim();
}

/**
 * Extract the attendee name from a full title given the base title.
 * Acuity format: "Attendee Name: Class Details"
 */
function extractAttendeeName(fullTitle: string, baseTitle: string): string {
  // Acuity format: "Attendee Name: Class Details"
  // The attendee name is BEFORE the first colon
  const colonIndex = fullTitle.indexOf(": ");
  if (colonIndex !== -1) {
    return fullTitle.slice(0, colonIndex).trim();
  }

  // Fallback for other separator formats
  let remainder = fullTitle.replace(baseTitle, "").trim();
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

// =============================================================================
// Series Detection
// =============================================================================

/**
 * Detect series of events that span multiple dates.
 * Groups events by series key (class name without dates/attendee), then merges
 * duplicates within each date.
 *
 * Example: 10 events (2 attendees × 5 dates) → 1 SeriesGroup with 5 merged events
 */
export function detectSeries(events: CalendarEvent[]): SeriesGroup[] {
  const seriesMap: Record<string, CalendarEvent[]> = {};

  // Group events by series key
  for (const event of events) {
    const baseTitle = extractBaseTitle(event.title);
    const seriesKey = extractSeriesKey(baseTitle);

    if (!seriesMap[seriesKey]) {
      seriesMap[seriesKey] = [];
    }
    seriesMap[seriesKey].push(event);
  }

  const seriesGroups: SeriesGroup[] = [];

  for (const [seriesKey, seriesEvents] of Object.entries(seriesMap)) {
    // Need at least 2 events to form a series
    if (seriesEvents.length < 2) continue;

    // Extract date pattern from first event
    const firstBaseTitle = extractBaseTitle(seriesEvents[0].title);
    const datePattern = extractDatePattern(firstBaseTitle);

    // Group events by their actual date
    const byDate = groupBy(seriesEvents, (e) => e.start.toISOString().split("T")[0]);

    // Only consider it a series if there are multiple dates OR multiple attendees on same date
    const hasMultipleDates = Object.keys(byDate).length > 1;
    const hasMultiplePerDate = Object.values(byDate).some((evts) => evts.length > 1);

    if (!hasMultipleDates && !hasMultiplePerDate) continue;

    // Merge duplicates within each date
    const eventsByDate: Record<string, DuplicateGroup> = {};
    const allAttendees = new Set<string>();
    const dates: Date[] = [];

    for (const [dateStr, dateEvents] of Object.entries(byDate)) {
      dates.push(new Date(dateStr));

      // Extract attendees for this date
      const attendees = dateEvents.map((e) => {
        const name = extractAttendeeName(e.title, extractBaseTitle(e.title));
        allAttendees.add(name);
        return name;
      });

      // Build merged title for this date
      const baseTitle = extractSeriesKey(extractBaseTitle(dateEvents[0].title));
      const mergedTitle = buildMergedTitle(baseTitle, attendees);

      eventsByDate[dateStr] = {
        events: dateEvents,
        baseTitle,
        mergedTitle,
        attendees,
        startTime: dateEvents[0].start,
      };
    }

    // Sort dates chronologically
    dates.sort((a, b) => a.getTime() - b.getTime());

    seriesGroups.push({
      seriesKey,
      baseTitle: seriesKey,
      datePattern: datePattern || "",
      dates,
      eventsByDate,
      allAttendees: Array.from(allAttendees),
      allEvents: seriesEvents,
    });
  }

  // Sort series by first date
  seriesGroups.sort((a, b) => {
    const aFirst = a.dates[0]?.getTime() || 0;
    const bFirst = b.dates[0]?.getTime() || 0;
    return aFirst - bFirst;
  });

  return seriesGroups;
}

/**
 * Extract the series key from a base title by removing the date pattern.
 * This allows events across different dates to be grouped together.
 *
 * Example:
 * - "NOSEWORK FOUNDATION: Mondays @ 7:15pm on Dec 1-8-15-22-29 (AS) (Austin)"
 * - → "NOSEWORK FOUNDATION: Mondays @ 7:15pm (AS) (Austin)"
 */
function extractSeriesKey(baseTitle: string): string {
  // Match date patterns like "on Dec 1-8-15-22-29" or "on Jan 5-12-19-26"
  // Also match "on December 1-8-15" etc.
  const datePatternRegex = /\s+on\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+[\d]+([-][\d]+)*/gi;

  return baseTitle.replace(datePatternRegex, "").trim();
}

/**
 * Extract the date pattern string from a base title.
 *
 * Example:
 * - "NOSEWORK FOUNDATION: Mondays @ 7:15pm on Dec 1-8-15-22-29 (AS) (Austin)"
 * - → "Dec 1-8-15-22-29"
 */
function extractDatePattern(baseTitle: string): string | null {
  const match = baseTitle.match(
    /on\s+((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+[\d]+(?:[-][\d]+)*)/i
  );

  return match ? match[1] : null;
}
