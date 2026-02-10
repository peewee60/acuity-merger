// Calendar event from Google Calendar API
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  calendarId: string;
  calendarName: string;
}

// Calendar info for selection
export interface CalendarInfo {
  id: string;
  name: string;
  color?: string;
  primary?: boolean;
}

// A group of duplicate events that can be merged
export interface DuplicateGroup {
  events: CalendarEvent[];
  baseTitle: string;
  mergedTitle: string;
  attendees: string[];
  startTime: Date;
}

// A series of related events across multiple dates
export interface SeriesGroup {
  seriesKey: string;              // Unique key for this series (title without dates/attendee)
  baseTitle: string;              // Class name without dates (for display)
  datePattern: string;            // Original pattern like "Dec 1-8-15-22-29"
  dates: Date[];                  // Parsed dates from the series
  eventsByDate: Record<string, DuplicateGroup>;  // Merged events per date (ISO date string key)
  allAttendees: string[];         // All unique attendees across series
  allEvents: CalendarEvent[];     // All original events in this series
}

// Result of merge operation
export interface MergeResult {
  success: boolean;
  createdEventId?: string;
  markedCount: number;
  error?: string;
}

// Result of series merge operation
export interface SeriesMergeResult {
  success: boolean;
  createdEventIds: string[];     // Recurring event or individual events
  mergedDates: number;           // Number of dates in the series
  totalEventsProcessed: number;
  markedCount: number;
  error?: string;
}
