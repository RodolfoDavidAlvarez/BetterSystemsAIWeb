import { useEffect } from "react";

export default function DevTrackerPage() {
  useEffect(() => {
    // The tracker is a standalone static HTML app served from /dev-tracker.html
    // (kept as single-file to avoid re-architecting the 1700-line port into React).
    window.location.replace("/dev-tracker.html");
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Opening Developer Tracker…</p>
        <p className="text-xs text-muted-foreground mt-2">
          If you are not redirected,{" "}
          <a href="/dev-tracker.html" className="underline">
            click here
          </a>
          .
        </p>
      </div>
    </div>
  );
}
