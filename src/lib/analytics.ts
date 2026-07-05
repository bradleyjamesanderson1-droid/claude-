// Plausible custom events. No-ops until the Plausible script is wired in
// Phase 3, so call sites can be instrumented from day one.

type EventProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (name: string, options?: { props?: EventProps }) => void;
  }
}

export function track(name: string, props?: EventProps): void {
  if (typeof window === "undefined") return;
  window.plausible?.(name, props ? { props } : undefined);
}
