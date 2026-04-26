import { useEffect } from "react";

/**
 * /workspace is now a no-op redirect — straight into the tracker.
 * No boxes, no welcome screens, no tabs. The tracker IS the workspace.
 */
export default function WorkspacePage() {
  useEffect(() => {
    window.location.replace("/dev-tracker.html");
  }, []);
  return null;
}
