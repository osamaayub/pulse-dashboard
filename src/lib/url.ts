/** Builds "?a=1&b=2" from the current params plus changes, dropping empty values. */
export function withParams(base: Record<string, string | number | undefined>, patch: Record<string, string | number | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, ...patch })) if (v !== undefined && v !== "" ) p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}
