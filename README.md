# Acuity Event Merger

Merge duplicate calendar events created by Acuity scheduling into single events with all attendees combined.

## Features

- **Google Calendar Integration** - Sign in with Google to access your calendars
- **Duplicate Detection** - Scan for events with the same time and similar titles
- **Smart Merging** - Combine multiple duplicate events into one with all attendees
- **Archive Option** - Move original events to an archive calendar instead of deleting

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Authentication**: NextAuth.js with Google OAuth
- **Styling**: Tailwind CSS 3.4 with custom dark theme
- **Fonts**: Fraunces (display) + DM Sans (body)
- **API**: Google Calendar API via googleapis

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Google Cloud Console project with Calendar API enabled
- OAuth 2.0 credentials

### Environment Variables

Create a `.env.local` file with:

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
bun install

# Run development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Usage

1. **Sign in** with your Google account
2. **Select a calendar** to scan for duplicates
3. **Choose a date range** (defaults to current month)
4. **Click "Scan for Duplicates"** to find duplicate events
5. **Review detected duplicates** - events grouped by time and similar title
6. **Merge events** - combines attendees into a single event

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/        # NextAuth.js endpoints
│   │   ├── calendars/   # Calendar list endpoint
│   │   ├── events/      # Event scanning endpoint
│   │   └── merge/       # Event merging endpoint
│   ├── dashboard/       # Main dashboard page
│   ├── globals.css      # Tailwind + custom styles
│   ├── layout.tsx       # Root layout with fonts
│   └── page.tsx         # Login page
├── components/
│   ├── CalendarSelector.tsx
│   ├── DateRangePicker.tsx
│   ├── DuplicateList.tsx
│   └── SessionProvider.tsx
├── lib/
│   └── auth.ts          # NextAuth configuration
└── types/
    └── index.ts         # TypeScript types
```

## License

Private project.
