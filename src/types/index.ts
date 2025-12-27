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

// Result of merge operation
export interface MergeResult {
  success: boolean;
  createdEventId?: string;
  movedCount: number;
  deletedCount: number;
  error?: string;
}

// User settings stored in localStorage
export interface UserSettings {
  archiveCalendarId?: string;
  archiveCalendarName?: string;
}
