"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import type { CalendarInfo, DuplicateGroup, SeriesGroup } from "@/types";
import { CalendarSelector } from "@/components/CalendarSelector";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DuplicateList } from "@/components/DuplicateList";
import { SeriesList } from "@/components/SeriesList";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [calendarsLoading, setCalendarsLoading] = useState(true);
  const [selectedCalendarId, setSelectedCalendarId] = useState("");
  const [targetCalendarId, setTargetCalendarId] = useState("");

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const [startDate, setStartDate] = useState(formatDate(firstOfMonth));
  const [endDate, setEndDate] = useState(formatDate(lastOfMonth));

  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [seriesGroups, setSeriesGroups] = useState<SeriesGroup[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [scanLoading, setScanLoading] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [activeTab, setActiveTab] = useState<"series" | "duplicates">("series");
  const [showMerged, setShowMerged] = useState(false);

  const sessionError = session?.error;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchCalendars() {
      try {
        const res = await fetch("/api/calendars");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to fetch calendars");
        }
        const data = await res.json();
        setCalendars(data);
        const primary = data.find((c: CalendarInfo) => c.primary);
        if (primary) setSelectedCalendarId(primary.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load calendars");
        console.error(err);
      } finally {
        setCalendarsLoading(false);
      }
    }

    fetchCalendars();
  }, [status]);

  const handleScan = useCallback(async () => {
    if (!selectedCalendarId) {
      setError("Please select a calendar");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setScanLoading(true);
    setDuplicateGroups([]);
    setSeriesGroups([]);
    setHasScanned(false);

    try {
      const params = new URLSearchParams({
        calendarId: selectedCalendarId,
        startDate,
        endDate,
        ...(showMerged && { showMerged: "true" }),
      });

      const res = await fetch(`/api/events?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch events");
      }

      const data = await res.json();
      setDuplicateGroups(data.duplicateGroups);
      setSeriesGroups(data.seriesGroups);
      setTotalEvents(data.totalEvents);
      setHasScanned(true);

      if (data.duplicateGroups.length === 0 && data.seriesGroups.length === 0) {
        setSuccessMessage(
          `Scanned ${data.totalEvents} events - no duplicates or series found!`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan for duplicates");
      console.error(err);
    } finally {
      setScanLoading(false);
    }
  }, [selectedCalendarId, startDate, endDate, showMerged]);

  const handleMerge = useCallback(
    async (group: DuplicateGroup, customTitle?: string) => {
      if (!targetCalendarId) {
        setError("Please select a target calendar");
        return;
      }
      setError(null);
      setMergeLoading(true);

      try {
        const res = await fetch("/api/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            group,
            customTitle,
            targetCalendarId,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Merge failed");
        }

        setDuplicateGroups((prev) =>
          prev.filter(
            (g) => !(String(g.startTime) === String(group.startTime) && g.baseTitle === group.baseTitle)
          )
        );

        const total = group.events.length;
        const marked = data.markedCount ?? 0;
        const markFailed = data.markFailedCount ?? 0;
        if (markFailed > 0) {
          setSuccessMessage(
            `Merged ${total} events into "${customTitle || group.mergedTitle}". ${marked}/${total} originals marked — ${markFailed} could not be updated (check Google Calendar manually).`
          );
        } else {
          setSuccessMessage(
            `Successfully merged ${total} events into "${customTitle || group.mergedTitle}". ${marked} originals marked as merged.`
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to merge events");
        console.error(err);
      } finally {
        setMergeLoading(false);
      }
    },
    [targetCalendarId]
  );

  const handleMergeSeries = useCallback(
    async (series: SeriesGroup) => {
      if (!targetCalendarId) {
        setError("Please select a target calendar");
        return;
      }
      setError(null);
      setMergeLoading(true);

      try {
        const res = await fetch("/api/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            series,
            targetCalendarId,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Merge failed");
        }

        setSeriesGroups((prev) =>
          prev.filter((s) => s.seriesKey !== series.seriesKey)
        );

        const total = series.allEvents.length;
        const marked = data.markedCount ?? 0;
        const markFailed = data.markFailedCount ?? 0;
        if (markFailed > 0) {
          setSuccessMessage(
            `Created recurring event for "${series.baseTitle}" across ${series.dates.length} dates. ${marked}/${total} originals marked — ${markFailed} could not be updated (check Google Calendar manually).`
          );
        } else {
          setSuccessMessage(
            `Created recurring event for "${series.baseTitle}" across ${series.dates.length} dates. ${total} originals marked as merged.`
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to merge series");
        console.error(err);
      } finally {
        setMergeLoading(false);
      }
    },
    [targetCalendarId]
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <svg
            className="animate-spin"
            style={{ width: "20px", height: "20px" }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return null;
  }

  if (sessionError === "RefreshAccessTokenError") {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-6">
        <div className="glass-card-elevated rounded-3xl p-10 max-w-md w-full animate-fade-in-up">
          <div className="flex justify-center mb-6">
            <div
              className="rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"
              style={{ width: "64px", height: "64px" }}
            >
              <svg
                className="text-amber-400"
                style={{ width: "32px", height: "32px" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
          </div>
          <div className="text-center mb-8">
            <h2
              className="text-xl font-semibold text-slate-50 mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Session expired
            </h2>
            <p className="text-slate-400 text-sm">
              Your Google access has expired. Please sign in again to continue.
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full btn-primary py-3 px-5 rounded-xl text-base cursor-pointer"
          >
            Sign in again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh">
      {/* Header */}
      <header className="glass-card border-0 border-b border-slate-700/50 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center"
              style={{ width: "36px", height: "36px" }}
            >
              <svg
                className="text-slate-950"
                style={{ width: "20px", height: "20px" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1
              className="text-xl font-semibold text-slate-50 tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Acuity Event Merger
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:block">
              {session?.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="btn-secondary rounded-lg px-3 py-2 text-sm cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Error */}
        {error && (
          <div className="alert alert-error mb-6 flex items-center gap-3 animate-fade-in">
            <svg
              style={{ width: "20px", height: "20px" }}
              className="flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div className="alert alert-success mb-6 flex items-center gap-3 animate-fade-in">
            <svg
              style={{ width: "20px", height: "20px" }}
              className="flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {successMessage}
          </div>
        )}

        {/* Controls */}
        <div className="glass-card-elevated rounded-2xl p-6 mb-6 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center text-amber-400"
              style={{ width: "40px", height: "40px" }}
            >
              <svg
                style={{ width: "20px", height: "20px" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <div>
              <h2
                className="text-lg font-semibold text-slate-50"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Scan for Duplicates
              </h2>
              <p className="text-sm text-slate-400">
                Select a calendar and date range to find duplicate events
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <CalendarSelector
              calendars={calendars}
              selectedId={selectedCalendarId}
              onChange={setSelectedCalendarId}
              isLoading={calendarsLoading}
              label="Source Calendar (Acuity sync)"
            />

            <div>
              <label
                htmlFor="target-calendar-select"
                className="label block mb-2"
              >
                Target Calendar (merged events go here)
              </label>
              <select
                id="target-calendar-select"
                value={targetCalendarId}
                onChange={(e) => setTargetCalendarId(e.target.value)}
                className="w-full input-field rounded-xl px-4 py-3 text-base cursor-pointer"
              >
                <option value="">Choose target calendar...</option>
                {calendars
                  .filter((cal) => cal.id !== selectedCalendarId)
                  .map((cal) => (
                    <option key={cal.id} value={cal.id}>
                      {cal.name}
                      {cal.primary ? " (Primary)" : ""}
                    </option>
                  ))}
              </select>
            </div>

            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
            />

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showMerged}
                onChange={(e) => setShowMerged(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500/50 cursor-pointer"
              />
              <span className="text-sm text-slate-400">
                Include already-merged events
              </span>
            </label>

            <button
              onClick={handleScan}
              disabled={scanLoading || !selectedCalendarId}
              className="w-full btn-primary py-4 px-5 rounded-xl text-base cursor-pointer disabled:cursor-not-allowed"
            >
              {scanLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin"
                    style={{ width: "20px", height: "20px" }}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Scanning...
                </span>
              ) : (
                "Scan for Duplicates"
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {hasScanned && (
          <div className="flex flex-col gap-6 animate-fade-in-up">
            {/* No results */}
            {duplicateGroups.length === 0 && seriesGroups.length === 0 ? (
              <div className="glass-card-elevated rounded-2xl p-6">
                <div className="text-center py-12">
                  <div
                    className="mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"
                    style={{ width: "64px", height: "64px" }}
                  >
                    <svg
                      className="text-emerald-400"
                      style={{ width: "32px", height: "32px" }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p
                    className="text-xl font-semibold text-slate-50 mb-2"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    No duplicates found
                  </p>
                  <p className="text-slate-400">
                    Scanned {totalEvents} events in the selected date range
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Tab Navigation */}
                <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <button
                    onClick={() => setActiveTab("series")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      activeTab === "series"
                        ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                        : "text-slate-400 hover:text-slate-300 hover:bg-slate-700/30 border border-transparent"
                    }`}
                  >
                    <svg
                      style={{ width: "18px", height: "18px" }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                      />
                    </svg>
                    Series
                    {seriesGroups.length > 0 && (
                      <span className="badge badge-violet text-xs">
                        {seriesGroups.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("duplicates")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      activeTab === "duplicates"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "text-slate-400 hover:text-slate-300 hover:bg-slate-700/30 border border-transparent"
                    }`}
                  >
                    <svg
                      style={{ width: "18px", height: "18px" }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                      />
                    </svg>
                    Duplicates
                    {duplicateGroups.length > 0 && (
                      <span className="badge badge-amber text-xs">
                        {duplicateGroups.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Tab Content */}
                <div className="glass-card-elevated rounded-2xl p-6">
                  {activeTab === "series" ? (
                    seriesGroups.length > 0 ? (
                      <SeriesList
                        series={seriesGroups}
                        onMergeSeries={handleMergeSeries}
                        isLoading={mergeLoading}
                      />
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <p>No event series found</p>
                        <p className="text-sm mt-1">
                          Series are events that repeat across multiple dates
                        </p>
                      </div>
                    )
                  ) : duplicateGroups.length > 0 ? (
                    <DuplicateList
                      groups={duplicateGroups}
                      onMerge={handleMerge}
                      isLoading={mergeLoading}
                    />
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <p>No duplicate events found</p>
                      <p className="text-sm mt-1">
                        Duplicates are multiple events at the same time
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
