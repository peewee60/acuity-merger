import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Acuity Event Merger",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-6">
      <main className="glass-card-elevated rounded-3xl p-10 max-w-2xl w-full animate-fade-in-up">
        <h1
          className="text-2xl font-semibold text-slate-50 mb-6 tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Privacy Policy
        </h1>

        <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-medium text-slate-100 mb-2">
              What this app does
            </h2>
            <p>
              Acuity Event Merger reads your Google Calendar events to detect
              duplicates created by Acuity Scheduling, then merges them into
              single events with all attendees listed.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-slate-100 mb-2">
              Data we access
            </h2>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Your Google Calendar event titles, times, and descriptions</li>
              <li>Your calendar list (names and IDs)</li>
              <li>Your Google account email (for sign-in)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-slate-100 mb-2">
              What we store
            </h2>
            <p>
              Nothing. This app is fully stateless. We do not have a database
              and do not store any of your calendar data, event information, or
              personal details. Your Google access token is held only in your
              browser session and is never saved server-side.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-slate-100 mb-2">
              How we use your data
            </h2>
            <p>
              Your calendar data is used solely to detect and merge duplicate
              events during your active session. Data is processed in real-time
              and discarded immediately after each request.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-slate-100 mb-2">
              Third-party sharing
            </h2>
            <p>
              We do not share, sell, or transfer your data to any third parties.
              The only external service used is the Google Calendar API, which
              is accessed using your own authenticated credentials.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-slate-100 mb-2">
              Revoking access
            </h2>
            <p>
              You can revoke this app&apos;s access to your Google account at any
              time by visiting{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
              >
                Google Account Permissions
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-slate-100 mb-2">
              Contact
            </h2>
            <p>
              For questions about this privacy policy, contact the app
              administrator.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700">
          <a
            href="/"
            className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
          >
            &larr; Back to home
          </a>
        </div>
      </main>
    </div>
  );
}
