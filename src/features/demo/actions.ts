"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/server/db";
import { resetSample } from "@/server/demo";
import { tooSoon } from "@/server/demo-rules";

export type ResetResult = { ok: true } | { ok: false; error: string };

const MESSAGES = {
  "not-due": "It was just reset. Try again in a minute.",
  busy: "A reset is already running.",
  "not-sample": "This database holds real data, so it is never reset.",
} as const;

/** Puts the sample store back to a fresh copy. Anyone can press it; it runs at most once a minute. */
export async function resetDemoData(): Promise<ResetResult> {
  const db = await getDb();
  const outcome = await resetSample(db, (seeded) => !tooSoon(seeded, new Date()));
  if (outcome !== "reset") return { ok: false, error: MESSAGES[outcome] };
  revalidatePath("/", "layout");
  return { ok: true };
}
