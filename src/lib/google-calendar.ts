import { google, calendar_v3 } from "googleapis";
import type { CalendarEvent, CalendarInfo } from "@/types";

// Create an OAuth2 client with the access token
function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}

// List all calendars the user has access to
export async function listCalendars(
  accessToken: string
): Promise<CalendarInfo[]> {
  const calendar = getCalendarClient(accessToken);
  const response = await calendar.calendarList.list();

  return (response.data.items || []).map((cal) => ({
    id: cal.id || "",
    name: cal.summary || "Untitled",
    color: cal.backgroundColor || undefined,
    primary: cal.primary || false,
  }));
}

// Get events from a calendar within a date range
export async function getEvents(
  accessToken: string,
  calendarId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const calendar = getCalendarClient(accessToken);

  const response = await calendar.events.list({
    calendarId,
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true, // Expand recurring events
    orderBy: "startTime",
    maxResults: 500,
  });

  const calendarInfo = await calendar.calendars.get({ calendarId });
  const calendarName = calendarInfo.data.summary || "Calendar";

  const ACUITY_MARKER = "(created by Acuity Scheduling)";
  const MERGED_MARKER = "[MERGED]";

  return (response.data.items || [])
    .filter((item) => item.status !== "cancelled")
    .filter((item) => item.description?.includes(ACUITY_MARKER))
    .filter((item) => !item.description?.includes(MERGED_MARKER))
    .map((item) => convertEvent(item, calendarId, calendarName));
}

// Convert Google Calendar event to our type
function convertEvent(
  item: calendar_v3.Schema$Event,
  calendarId: string,
  calendarName: string
): CalendarEvent {
  const isAllDay = !!item.start?.date;

  let start: Date;
  let end: Date;

  if (isAllDay) {
    start = new Date(item.start!.date!);
    end = new Date(item.end!.date!);
  } else {
    start = new Date(item.start!.dateTime!);
    end = new Date(item.end!.dateTime!);
  }

  return {
    id: item.id || "",
    title: item.summary || "Untitled",
    description: item.description || undefined,
    start,
    end,
    allDay: isAllDay,
    calendarId,
    calendarName,
  };
}

// Get the timezone configured for a calendar
async function getCalendarTimeZone(
  calendar: calendar_v3.Calendar,
  calendarId: string
): Promise<string> {
  const res = await calendar.calendars.get({ calendarId });
  return res.data.timeZone || "UTC";
}

// Create a new event
export async function createEvent(
  accessToken: string,
  calendarId: string,
  event: Omit<CalendarEvent, "id" | "calendarId" | "calendarName">
): Promise<string> {
  const calendar = getCalendarClient(accessToken);
  const timeZone = await getCalendarTimeZone(calendar, calendarId);

  const gEvent: calendar_v3.Schema$Event = {
    summary: event.title,
    description: event.description,
  };

  if (event.allDay) {
    gEvent.start = { date: formatDate(event.start) };
    gEvent.end = { date: formatDate(event.end) };
  } else {
    gEvent.start = { dateTime: event.start.toISOString(), timeZone };
    gEvent.end = { dateTime: event.end.toISOString(), timeZone };
  }

  const response = await calendar.events.insert({
    calendarId,
    requestBody: gEvent,
  });

  return response.data.id || "";
}

// Create a recurring event using RDATE (explicit date list)
export async function createRecurringEvent(
  accessToken: string,
  calendarId: string,
  event: Omit<CalendarEvent, "id" | "calendarId" | "calendarName">,
  recurrence: string[]
): Promise<string> {
  const calendar = getCalendarClient(accessToken);
  const timeZone = await getCalendarTimeZone(calendar, calendarId);

  const gEvent: calendar_v3.Schema$Event = {
    summary: event.title,
    description: event.description,
    recurrence,
  };

  if (event.allDay) {
    gEvent.start = { date: formatDate(event.start) };
    gEvent.end = { date: formatDate(event.end) };
  } else {
    gEvent.start = { dateTime: event.start.toISOString(), timeZone };
    gEvent.end = { dateTime: event.end.toISOString(), timeZone };
  }

  const response = await calendar.events.insert({
    calendarId,
    requestBody: gEvent,
  });

  return response.data.id || "";
}

// Mark an event as merged by prepending [MERGED] to its description
export async function markEventAsMerged(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const calendar = getCalendarClient(accessToken);
  const existing = await calendar.events.get({ calendarId, eventId });
  const currentDescription = existing.data.description || "";

  if (!currentDescription.includes("[MERGED]")) {
    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: {
        description: `[MERGED]\n${currentDescription}`,
      },
    });
  }
}

// Format date as YYYY-MM-DD for all-day events
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
