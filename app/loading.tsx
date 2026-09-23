// The dashboard layout waits on the session and workspace queries before it
// renders. Without a boundary above it the first byte waits too, and an
// installed app keeps its splash screen up until then. This fallback streams
// straight away, so the app paints while those queries run.
//
// It stays static: reading the locale cookie here would turn every prerendered
// page dynamic, so it shows the wordmark rather than translated text.
export default function Loading() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <p className="text-base font-semibold text-muted">OpenReply</p>
    </div>
  );
}
