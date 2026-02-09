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

  return (response.data.items || [])
    .filter((item) => item.status !== "cancelled")
    .filter((item) => item.description?.includes(ACUITY_MARKER))
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

// Create a new event
export async function createEvent(
  accessToken: string,
  calendarId: string,
  event: Omit<CalendarEvent, "id" | "calendarId" | "calendarName">
): Promise<string> {
  const calendar = getCalendarClient(accessToken);

  const gEvent: calendar_v3.Schema$Event = {
    summary: event.title,
    description: event.description,
  };

  if (event.allDay) {
    gEvent.start = { date: formatDate(event.start) };
    gEvent.end = { date: formatDate(event.end) };
  } else {
    gEvent.start = { dateTime: event.start.toISOString() };
    gEvent.end = { dateTime: event.end.toISOString() };
  }

  const response = await calendar.events.insert({
    calendarId,
    requestBody: gEvent,
  });

  return response.data.id || "";
}

// Delete an event
export async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const calendar = getCalendarClient(accessToken);
  await calendar.events.delete({ calendarId, eventId });
}

// Move an event to a different calendar
export async function moveEvent(
  accessToken: string,
  sourceCalendarId: string,
  eventId: string,
  destinationCalendarId: string
): Promise<void> {
  const calendar = getCalendarClient(accessToken);
  await calendar.events.move({
    calendarId: sourceCalendarId,
    eventId,
    destination: destinationCalendarId,
  });
}

// Format date as YYYY-MM-DD for all-day events
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
