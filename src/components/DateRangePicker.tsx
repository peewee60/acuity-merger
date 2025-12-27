"use client";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: DateRangePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor="start-date" className="label block mb-2">
          Start Date
        </label>
        <input
          type="date"
          id="start-date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="w-full input-field rounded-xl px-4 text-base"
        />
      </div>
      <div>
        <label htmlFor="end-date" className="label block mb-2">
          End Date
        </label>
        <input
          type="date"
          id="end-date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="w-full input-field rounded-xl px-4 text-base"
        />
      </div>
    </div>
  );
}
