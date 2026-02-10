"use client";

import type { CalendarInfo } from "@/types";

interface CalendarSelectorProps {
  calendars: CalendarInfo[];
  selectedId: string;
  onChange: (id: string) => void;
  isLoading: boolean;
  label?: string;
}

export function CalendarSelector({
  calendars,
  selectedId,
  onChange,
  isLoading,
  label = "Calendar",
}: CalendarSelectorProps) {
  if (isLoading) {
    return (
      <div>
        <div className="label mb-2">{label}</div>
        <div className="h-12 skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="calendar-select" className="label block mb-2">
        {label}
      </label>
      <div className="relative">
        <select
          id="calendar-select"
          value={selectedId}
          onChange={(e) => onChange(e.target.value)}
          className="w-full input-field rounded-xl px-4 text-base cursor-pointer"
        >
          <option value="">Choose a calendar...</option>
          {calendars.map((cal) => (
            <option key={cal.id} value={cal.id}>
              {cal.name}
              {cal.primary ? " (Primary)" : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
