/**
 * Sri Lanka Timezone Utilities
 *
 * All dates received from the backend are stored as UTC in the database.
 * These helpers ensure every date displayed in the UI is always shown in
 * Sri Lanka Standard Time (UTC+5:30 / Asia/Colombo), regardless of the
 * timezone of the device running the browser.
 *
 * Usage:
 *   import { formatSL, startOfDaySL, endOfDaySL } from "@/utils/dateUtils";
 *
 *   // Display
 *   formatSL(order.createdAt, "dd/MM/yyyy HH:mm")   // "05/06/2026 09:30"
 *   formatSL(order.createdAt, "HH:mm")               // "09:30"
 *
 *   // "Today" filter range
 *   const from = startOfDaySL();   // midnight SL time as Date (UTC internally)
 *   const to   = endOfDaySL();     // 23:59:59 SL time as Date (UTC internally)
 */

const SL_TIMEZONE = "Asia/Colombo";

// ─── Formatting ────────────────────────────────────────────────────────────────

/**
 * Format a date in Sri Lanka timezone using a date-fns-style format string.
 * Supported tokens:
 *   yyyy  – 4-digit year
 *   MMMM  – full month name (e.g. "June")
 *   MMM   – short month name (e.g. "Jun")
 *   MM    – 2-digit month
 *   dd    – 2-digit day
 *   HH    – 24-hour hour
 *   hh    – 12-hour hour (with leading zero)
 *   mm    – minutes
 *   ss    – seconds
 *   a     – AM/PM
 */
export function formatSL(date: Date | string | null | undefined, pattern: string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  // Extract parts in SL timezone via Intl (24-hour for numeric parts)
  const parts24 = new Intl.DateTimeFormat("en-GB", {
    timeZone: SL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts24.find((p) => p.type === type)?.value ?? "00";

  // Full month name in SL timezone
  const fullMonth = new Intl.DateTimeFormat("en-US", {
    timeZone: SL_TIMEZONE,
    month: "long",
  }).format(d);

  // Short month name in SL timezone
  const shortMonth = new Intl.DateTimeFormat("en-US", {
    timeZone: SL_TIMEZONE,
    month: "short",
  }).format(d);

  // 12-hour clock value and AM/PM
  const hour24 = parseInt(get("hour"), 10);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const hh = String(hour12).padStart(2, "0");
  const ampm = hour24 < 12 ? "AM" : "PM";

  return pattern
    .replace("yyyy", get("year"))
    .replace("MMMM", fullMonth)
    .replace("MMM", shortMonth)
    .replace("MM", get("month"))
    .replace("dd", get("day"))
    .replace("HH", get("hour"))
    .replace("hh", hh)
    .replace("mm", get("minute"))
    .replace("ss", get("second"))
    .replace("a", ampm);
}

// ─── "Today" Range in SL Time ──────────────────────────────────────────────────

/**
 * Returns a Date representing 00:00:00 of today in Sri Lanka time.
 * Use .toISOString() when sending to the backend as a query parameter.
 */
export function startOfDaySL(date?: Date): Date {
  const d = date ?? new Date();
  // Get current date components in SL timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: SL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const slDateStr = formatter.format(d); // "2026-06-05"
  // Build a Date that represents midnight in SL timezone (stored as correct UTC)
  return new Date(`${slDateStr}T00:00:00+05:30`);
}

/**
 * Returns a Date representing 23:59:59.999 of today in Sri Lanka time.
 * Use .toISOString() when sending to the backend as a query parameter.
 */
export function endOfDaySL(date?: Date): Date {
  const d = date ?? new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: SL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const slDateStr = formatter.format(d);
  return new Date(`${slDateStr}T23:59:59.999+05:30`);
}

/**
 * Returns the current time as a Date adjusted to SL timezone context.
 * Equivalent to "now" but useful as a reference for SL-aware calculations.
 */
export function nowSL(): Date {
  return new Date();
}
