// Client-side .ics generation — a recurring weekly event with zero backend.
// Floating local times (no TZID) so the event lands at the user's wall-clock
// time on iOS, Android, Google Calendar and Outlook alike.

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function icsLocal(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(
    d.getHours()
  )}${pad(d.getMinutes())}00`;
}

function icsUtcNow(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(
    d.getUTCDate()
  )}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

export function buildWeeklyResetIcs(start: Date, siteUrl: string): string {
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@undisciplined`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//undisciplined//The Weekly Reset//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsUtcNow()}`,
    `DTSTART:${icsLocal(start)}`,
    `DTEND:${icsLocal(end)}`,
    "RRULE:FREQ=WEEKLY",
    "SUMMARY:Weekly reset",
    `DESCRIPTION:Five minutes. Close the week\\, pick three\\, lower the friction. ${siteUrl}/reset`,
    `URL:${siteUrl}/reset`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}

export function downloadIcs(start: Date, siteUrl: string): void {
  const blob = new Blob([buildWeeklyResetIcs(start, siteUrl)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "weekly-reset.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
