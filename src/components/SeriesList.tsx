"use client";

import type { SeriesGroup } from "@/types";
import { useState } from "react";

interface SeriesListProps {
  series: SeriesGroup[];
  onMergeSeries: (series: SeriesGroup) => Promise<void>;
  isLoading: boolean;
}

export function SeriesList({
  series,
  onMergeSeries,
  isLoading,
}: SeriesListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [mergingIndex, setMergingIndex] = useState<number | null>(null);

  if (series.length === 0) {
    return null;
  }

  const handleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleMerge = async (seriesGroup: SeriesGroup, index: number) => {
    setMergingIndex(index);
    try {
      await onMergeSeries(seriesGroup);
      setExpandedIndex(null);
    } finally {
      setMergingIndex(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400"
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
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
          </div>
          <div>
            <h2
              className="text-lg font-semibold text-slate-50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Found {series.length} event series
            </h2>
            <p className="text-sm text-slate-400">
              Multi-date series with duplicates to merge
            </p>
          </div>
        </div>
      </div>

      {/* Series Groups */}
      <div className="flex flex-col gap-4">
        {series.map((seriesGroup, index) => (
          <div
            key={index}
            className={`rounded-xl border overflow-hidden transition-all ${
              expandedIndex === index
                ? "border-violet-500/30 bg-slate-800/50"
                : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
            }`}
          >
            {/* Header - always visible */}
            <button
              onClick={() => handleExpand(index)}
              className={`w-full p-4 flex items-center justify-between border-0 cursor-pointer text-left transition-colors ${
                expandedIndex === index
                  ? "bg-slate-700/30"
                  : "bg-transparent hover:bg-slate-700/20"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className="rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center text-violet-400"
                  style={{ width: "48px", height: "48px" }}
                >
                  <svg
                    style={{ width: "24px", height: "24px" }}
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
                </div>
                <div>
                  <p className="font-medium text-slate-50">
                    {seriesGroup.baseTitle}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {seriesGroup.datePattern && (
                      <span className="text-violet-400">
                        {seriesGroup.datePattern}
                      </span>
                    )}
                    {!seriesGroup.datePattern && (
                      <span>
                        {seriesGroup.dates.length} dates
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge badge-violet">
                  {seriesGroup.dates.length} dates
                </span>
                <span className="badge badge-amber">
                  {seriesGroup.allEvents.length} events
                </span>
                <span className="badge badge-emerald">
                  {seriesGroup.allAttendees.length} attendees
                </span>
                <svg
                  className={`text-slate-400 transition-transform ${
                    expandedIndex === index ? "rotate-180" : ""
                  }`}
                  style={{ width: "20px", height: "20px" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {/* Expanded content */}
            {expandedIndex === index && (
              <div className="border-t border-slate-700 p-5 animate-fade-in">
                {/* Attendees */}
                <div className="mb-5">
                  <h4 className="label-caps mb-3">All Attendees</h4>
                  <div className="flex flex-wrap gap-2">
                    {seriesGroup.allAttendees.map((name, i) => (
                      <span
                        key={i}
                        className="badge badge-emerald flex items-center gap-2"
                      >
                        <svg
                          style={{ width: "14px", height: "14px" }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Events by date */}
                <div className="mb-6">
                  <h4 className="label-caps mb-3">Events by Date</h4>
                  <div className="bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden">
                    {Object.entries(seriesGroup.eventsByDate).map(
                      ([dateStr, group], i, arr) => (
                        <div
                          key={dateStr}
                          className={`px-4 py-3 ${
                            i < arr.length - 1 ? "border-b border-slate-700" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-200">
                              {formatDate(dateStr)}
                            </span>
                            <span className="text-xs text-slate-500">
                              {group.events.length} event
                              {group.events.length !== 1 ? "s" : ""} →{" "}
                              {group.attendees.length} attendee
                              {group.attendees.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {group.attendees.map((name, j) => (
                              <span
                                key={j}
                                className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Merge button */}
                <button
                  onClick={() => handleMerge(seriesGroup, index)}
                  disabled={isLoading || mergingIndex !== null}
                  className="w-full btn-primary py-4 px-5 rounded-xl text-base cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {mergingIndex === index ? (
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
                      Merging into recurring series...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        style={{ width: "20px", height: "20px" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Merge into recurring series
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00"); // Add time to avoid timezone issues
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
