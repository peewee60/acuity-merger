import { auth } from "@/lib/auth";
import { executeMerge, executeSeriesMerge } from "@/lib/merge-executor";
import type { DuplicateGroup, SeriesGroup } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { group, series, archiveCalendarId, customTitle } = body as {
      group?: DuplicateGroup;
      series?: SeriesGroup;
      archiveCalendarId?: string;
      customTitle?: string;
    };

    // Handle series merge
    if (series) {
      if (!series.allEvents || series.allEvents.length < 2) {
        return NextResponse.json(
          { error: "Invalid series group" },
          { status: 400 }
        );
      }

      // Convert date strings back to Date objects
      const seriesWithDates: SeriesGroup = {
        ...series,
        dates: series.dates.map((d) => new Date(d)),
        allEvents: series.allEvents.map((e) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
        })),
        eventsByDate: Object.fromEntries(
          Object.entries(series.eventsByDate).map(([dateStr, group]) => [
            dateStr,
            {
              ...group,
              startTime: new Date(group.startTime),
              events: group.events.map((e) => ({
                ...e,
                start: new Date(e.start),
                end: new Date(e.end),
              })),
            },
          ])
        ),
      };

      const result = await executeSeriesMerge(
        session.accessToken,
        seriesWithDates,
        { archiveCalendarId }
      );

      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json(
          { error: result.error || "Series merge failed" },
          { status: 500 }
        );
      }
    }

    // Handle single duplicate group merge
    if (!group || !group.events || group.events.length < 2) {
      return NextResponse.json(
        { error: "Invalid merge group" },
        { status: 400 }
      );
    }

    // Convert date strings back to Date objects
    const groupWithDates: DuplicateGroup = {
      ...group,
      startTime: new Date(group.startTime),
      events: group.events.map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      })),
    };

    const result = await executeMerge(session.accessToken, groupWithDates, {
      archiveCalendarId,
      customTitle,
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error || "Merge failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Merge failed:", error);
    return NextResponse.json(
      { error: "Failed to execute merge" },
      { status: 500 }
    );
  }
}
