type EventData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: { track: (event: string, data?: EventData) => void };
  }
}

/** Fire a custom Umami event. Safe to call anywhere — no-ops on the server or when the script is blocked. */
export function track(event: string, data?: EventData) {
  if (typeof window === "undefined") return;
  try {
    window.umami?.track(event, data);
  } catch {
    // analytics must never break the app
  }
}
