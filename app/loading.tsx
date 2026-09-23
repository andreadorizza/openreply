// The dashboard layout waits on the session and workspace queries before it
// renders. Without a boundary above it the first byte waits too, and an
// installed app keeps its splash screen up until then. This fallback streams
// straight away, so the app paints while those queries run.
//
// It stays static: reading the locale cookie here would turn every prerendered
// page dynamic, so the message is shown in English and Italian side by side.
export default function Loading() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-2 px-4 text-center"
      role="status"
    >
      <p className="text-base font-semibold">OpenReply</p>
      <p className="text-sm text-muted">Loading…</p>
      <p className="text-sm text-muted" lang="it">
        Caricamento in corso…
      </p>
    </div>
  );
}
