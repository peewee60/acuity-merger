"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

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

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-6">
      <main className="glass-card-elevated rounded-3xl p-10 max-w-md w-full animate-fade-in-up">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div
              className="rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center glow-amber"
              style={{ width: "80px", height: "80px" }}
            >
              <svg
                className="text-slate-950"
                style={{ width: "40px", height: "40px" }}
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
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-semibold text-slate-50 mb-3 tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Acuity Event Merger
          </h1>
          <p className="text-slate-400 leading-relaxed">
            Merge duplicate calendar events from Acuity scheduling into single
            events with all attendees.
          </p>
        </div>

        {/* Sign in button */}
        <div>
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full btn-secondary rounded-xl px-5 py-4 flex items-center justify-center gap-3 cursor-pointer group"
          >
            <svg style={{ width: "20px", height: "20px" }} viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-slate-100 font-medium group-hover:text-white transition-colors">
              Sign in with Google
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-slate-500 text-sm">How it works</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {[
            {
              icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
              text: "Sign in with Google to access your calendar",
            },
            {
              icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
              text: "Select a calendar and date range to scan",
            },
            {
              icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
              text: "Review detected duplicates (same time, similar title)",
            },
            {
              icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
              text: "Merge into single events with all attendees",
            },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-4 group">
              <div
                className="flex-shrink-0 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center text-amber-400 group-hover:bg-slate-600 transition-all"
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
                    d={step.icon}
                  />
                </svg>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed pt-2.5">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
