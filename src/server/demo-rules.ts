/** Pure rules for the demo reset, kept apart from the database so they can be unit tested. */

/** True when every customer uses the sample domain: the store is the app's own sample data, safe to replace. */
export const SAMPLE_EMAIL_DOMAIN = "@example.com";

/** Is an automatic reset due? Never when turned off (0 hours) or when we don't know when the data was made. */
export function resetDue(seededAt: Date | null, now: Date, hours: number) {
  if (!hours || !seededAt) return false;
  return now.getTime() - seededAt.getTime() >= hours * 3_600_000;
}

/** The button can't be used to hammer the database: one reset per minute, store-wide. */
export function tooSoon(seededAt: Date | null, now: Date, minSeconds = 60) {
  return !!seededAt && now.getTime() - seededAt.getTime() < minSeconds * 1000;
}
