# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start development server at localhost:3000
bun build        # Production build
bun lint         # Run ESLint
```

## Architecture

This is a Next.js 16 App Router application that merges duplicate Google Calendar events created by Acuity scheduling software.

### Core Flow

1. User authenticates via Google OAuth (NextAuth.js in `src/lib/auth.ts`)
2. User selects a calendar and date range on the dashboard
3. `/api/events` fetches events and runs duplicate/series detection
4. User reviews detected groups and triggers merges via `/api/merge`

### Key Modules

**Duplicate Detection** (`src/lib/duplicate-detector.ts`):
- `detectDuplicates()` - Groups events by exact start time + base title (before attendee name)
- `detectSeries()` - Groups events by class name across multiple dates (e.g., "Dec 1-8-15-22-29")
- Acuity title format: `"Attendee Name: Class Details"` - attendee is BEFORE the first colon

**Merge Execution** (`src/lib/merge-executor.ts`):
- `executeMerge()` - Creates merged event, then moves/deletes originals
- `executeSeriesMerge()` - Processes each date in a series separately
- Supports archiving originals to a separate calendar instead of deleting

**Google Calendar API** (`src/lib/google-calendar.ts`):
- Wrapper functions for calendar operations using access token from session

### Auth Token Flow

The NextAuth JWT callback (`src/lib/auth.ts`) handles:
- Initial token storage on sign-in
- Automatic token refresh when expired
- Access token exposed via `session.accessToken`

### Types

All TypeScript interfaces are in `src/types/index.ts`:
- `CalendarEvent`, `DuplicateGroup`, `SeriesGroup` for detection
- `MergeResult`, `SeriesMergeResult` for merge operations

## Environment Variables

Required in `.env.local`:
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `NEXTAUTH_SECRET` - Random secret for NextAuth
- `NEXTAUTH_URL` - Base URL (http://localhost:3000 for dev)
