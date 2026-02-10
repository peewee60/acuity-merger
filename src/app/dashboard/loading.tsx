export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-mesh">
      {/* Header skeleton */}
      <header className="glass-card border-0 border-b border-slate-700/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-700 animate-pulse" />
            <div className="w-40 h-6 rounded bg-slate-700 animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-32 h-4 rounded bg-slate-700 animate-pulse hidden sm:block" />
            <div className="w-20 h-8 rounded-lg bg-slate-700 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main content skeleton */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="glass-card-elevated rounded-2xl p-6 animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-700" />
            <div>
              <div className="w-44 h-5 rounded bg-slate-700 mb-2" />
              <div className="w-64 h-4 rounded bg-slate-700" />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="w-full h-12 rounded-xl bg-slate-700" />
            <div className="w-full h-12 rounded-xl bg-slate-700" />
            <div className="flex gap-4">
              <div className="flex-1 h-12 rounded-xl bg-slate-700" />
              <div className="flex-1 h-12 rounded-xl bg-slate-700" />
            </div>
            <div className="w-full h-14 rounded-xl bg-slate-700" />
          </div>
        </div>
      </main>
    </div>
  );
}
