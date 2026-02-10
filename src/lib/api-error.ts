import { NextResponse } from "next/server";

interface GoogleApiError {
  code?: number;
  message?: string;
  errors?: Array<{ reason?: string }>;
}

export function handleApiError(error: unknown, fallbackMessage: string) {
  const gError = extractGoogleError(error);

  if (gError) {
    switch (gError.code) {
      case 401:
        return NextResponse.json(
          { error: "Your Google session has expired. Please sign in again." },
          { status: 401 }
        );
      case 403: {
        const reason = gError.errors?.[0]?.reason;
        if (reason === "rateLimitExceeded" || reason === "userRateLimitExceeded") {
          return NextResponse.json(
            { error: "Google API rate limit reached. Please wait a moment and try again." },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { error: "Insufficient permissions. Make sure you granted calendar access." },
          { status: 403 }
        );
      }
      case 404:
        return NextResponse.json(
          { error: "Calendar not found. It may have been deleted or unshared." },
          { status: 404 }
        );
    }
  }

  console.error(`${fallbackMessage}:`, error);
  const message = error instanceof Error ? error.message : fallbackMessage;
  return NextResponse.json({ error: message }, { status: 500 });
}

function extractGoogleError(error: unknown): GoogleApiError | null {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as GoogleApiError).code === "number"
  ) {
    return error as GoogleApiError;
  }
  return null;
}
