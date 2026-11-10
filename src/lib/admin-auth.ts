import "server-only";

import { runtimeEnv } from "./runtime-env";

function adminEmails() {
  return new Set(
    (runtimeEnv("ADMIN_EMAILS") ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function hasAdminEmails() {
  return adminEmails().size > 0;
}

export function isAdminEmail(email: string | null | undefined): email is string {
  return Boolean(email && adminEmails().has(email.trim().toLowerCase()));
}
