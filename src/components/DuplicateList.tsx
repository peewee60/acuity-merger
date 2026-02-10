"use client";

import type { DuplicateGroup } from "@/types";
import { useState } from "react";

interface DuplicateListProps {
  groups: DuplicateGroup[];
  onMerge: (group: DuplicateGroup, customTitle?: string) => Promise<void>;
  isLoading: boolean;
}

export function DuplicateList({
  groups,
  onMerge,
  isLoading,
}: DuplicateListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [mergingIndex, setMergingIndex] = useState<number | null>(null);

  if (groups.length === 0) {
    return null;
  }

  const handleExpand = (index: number) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
      setEditingTitle("");
    } else {
      setExpandedIndex(index);
      setEditingTitle(groups[index].mergedTitle);
    }
  };

  const handleMerge = async (group: DuplicateGroup, index: number) => {
    setMergingIndex(index);
    try {
      await onMerge(
        group,
        editingTitle !== group.mergedTitle ? editingTitle : undefined
      );
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
            className="rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400"
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
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h2
              className="text-lg font-semibold text-slate-50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Found {groups.length} duplicate group
              {groups.length !== 1 ? "s" : ""}
            </h2>
            <p className="text-sm text-slate-400">
              Review and merge duplicate events
            </p>
          </div>
        </div>
      </div>

      {/* Groups */}
      <div className="flex flex-col gap-4">
        {groups.map((group, index) => (
          <div
            key={index}
            className={`rounded-xl border overflow-hidden transition-all ${
              expandedIndex === index
                ? "border-amber-500/30 bg-slate-800/50"
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
                  className="rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center text-amber-400"
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-50">{group.baseTitle}</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {formatTime(group.startTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge badge-amber">
                  {group.events.length} events
                </span>
                <span className="badge badge-emerald">
                  {group.attendees.length} attendees
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
                {/* Original events */}
                <div className="mb-5">
                  <h4 className="label-caps mb-3">Original Events</h4>
                  <div className="bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden">
                    {group.events.map((event, i) => (
                      <div
                        key={event.id}
                        className={`px-4 py-3 text-sm text-slate-300 flex items-center gap-3 ${
                          i < group.events.length - 1
                            ? "border-b border-slate-700"
                            : ""
                        }`}
                      >
                        <span
                          className="rounded-lg bg-slate-700 text-slate-400 flex items-center justify-center text-xs font-medium"
                          style={{ width: "24px", height: "24px" }}
                        >
                          {i + 1}
                        </span>
                        <span>{event.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Merged title editor */}
                <div className="mb-5">
                  <label className="label-caps block mb-3">
                    Merged Event Title
                  </label>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="w-full input-field rounded-xl px-4 py-3 text-base"
                  />
                </div>

                {/* Attendees */}
                <div className="mb-6">
                  <h4 className="label-caps mb-3">Attendees</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.attendees.map((name, i) => (
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

                {/* Merge button */}
                <button
                  onClick={() => handleMerge(group, index)}
                  disabled={isLoading || mergingIndex !== null}
                  className="w-full btn-primary py-4 px-5 rounded-xl text-base cursor-pointer disabled:cursor-not-allowed"
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
                      Merging...
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
                      Merge {group.events.length} events into one
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

function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
