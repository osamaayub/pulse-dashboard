import "server-only";
import { z } from "zod";

/** Every environment variable the app reads, checked once at startup. A typo fails fast with a clear message. */
const pgUrl = z
  .string()
  .regex(/^postgres(ql)?:\/\//, "must start with postgres:// or postgresql://")
  .optional();

const schema = z.object({
  /** Any PostgreSQL: local, Neon, Supabase, RDS... */
  DATABASE_URL: pgUrl,
  /** Set automatically by Netlify when the project has a Netlify Database. */
  NETLIFY_DB_URL: pgUrl,
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) throw new Error(`Invalid environment: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);

export const env = parsed.data;

/** The database to use: an explicit DATABASE_URL wins, then Netlify's own database, else none (demo mode). */
export const databaseUrl = env.DATABASE_URL ?? env.NETLIFY_DB_URL;
