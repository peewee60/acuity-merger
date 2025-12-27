import { auth } from "@/lib/auth";
import { getEvents } from "@/lib/google-calendar";
import { detectDuplicates, detectSeries } from "@/lib/duplicate-detector";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const calendarId = searchParams.get("calendarId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!calendarId || !startDate || !endDate) {
    return NextResponse.json(
      { error: "Missing required parameters: calendarId, startDate, endDate" },
      { status: 400 }
    );
  }

  try {
    const events = await getEvents(
      session.accessToken,
      calendarId,
      new Date(startDate),
      new Date(endDate)
    );

    // Detect duplicates (same time, same class)
    const duplicateGroups = detectDuplicates(events);

    // Detect series (same class across multiple dates)
    const seriesGroups = detectSeries(events);

    return NextResponse.json({
      events,
      duplicateGroups,
      seriesGroups,
      totalEvents: events.length,
      duplicateCount: duplicateGroups.reduce(
        (sum, g) => sum + g.events.length,
        0
      ),
      seriesCount: seriesGroups.reduce(
        (sum, s) => sum + s.allEvents.length,
        0
      ),
    });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
