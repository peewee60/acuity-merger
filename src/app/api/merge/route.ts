import { auth } from "@/lib/auth";
import { executeMerge } from "@/lib/merge-executor";
import type { DuplicateGroup } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { group, archiveCalendarId, customTitle } = body as {
      group: DuplicateGroup;
      archiveCalendarId?: string;
      customTitle?: string;
    };

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
