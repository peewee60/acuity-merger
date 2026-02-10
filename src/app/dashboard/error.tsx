"use client";

import { signOut } from "next-auth/react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-6">
      <div className="glass-card-elevated rounded-3xl p-10 max-w-md w-full animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div
            className="rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center"
            style={{ width: "64px", height: "64px" }}
          >
            <svg
              className="text-red-400"
              style={{ width: "32px", height: "32px" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2
            className="text-xl font-semibold text-slate-50 mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Something went wrong
          </h2>
          <p className="text-slate-400 text-sm">
            {error.message || "An unexpected error occurred."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full btn-primary py-3 px-5 rounded-xl text-base cursor-pointer"
          >
            Try again
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full btn-secondary py-3 px-5 rounded-xl text-sm cursor-pointer"
          >
            Sign out and start over
          </button>
        </div>
      </div>
    </div>
  );
}
