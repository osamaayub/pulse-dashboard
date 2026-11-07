import "server-only";
import { z } from "zod";

const pgUrl = z.string().trim().regex(/^postgres(ql)?:\/\//, "must start with postgres:// or postgresql://");

/** Which database to use: DATABASE_URL first, then Netlify Database, else the built-in demo database.
 *  A malformed value is reported on /api/health instead of crashing every page. */
function pick() {
  const problems: string[] = [];
  for (const name of ["DATABASE_URL", "NETLIFY_DB_URL"] as const) {
    const raw = process.env[name];
    if (!raw) continue;
    const r = pgUrl.safeParse(raw);
    if (r.success) return { url: r.data, source: name, problems };
    problems.push(`${name} ${r.error.issues[0].message}`);
  }
  return { url: undefined, source: "demo" as const, problems };
}

export const database = pick();

/** Sample data is replaced with a fresh copy this often (hours). 0 turns it off. Only ever applies to the app's own sample data. */
export const demoResetHours = z.coerce.number().min(0).max(24 * 30).catch(24).parse(process.env.DEMO_RESET_HOURS ?? 24);
