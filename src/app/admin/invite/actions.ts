"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@auth";
import { hashAdminPassword } from "@/lib/admin-password";
import { acceptAdminInvitation, pendingInvitation } from "@/server/admin-invitations";
import { runtimeEnv } from "@/lib/runtime-env";
import { z } from "zod";

const INVITATION_COOKIE = "pulse_admin_invite";

export async function beginAdminInviteSignIn(token: string) {
  const invitation = await pendingInvitation(token);
  if (!invitation) redirect("/admin/sign-in?invite=invalid");
  const cookieStore = await cookies();
  cookieStore.set(INVITATION_COOKIE, token, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: runtimeEnv("NODE_ENV") === "production",
  });
  await signIn("google", { redirectTo: "/admin" });
}

export type AdminInviteSignupState = { ok: boolean; message: string } | null;

const signupFields = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  password: z.string().min(12).max(128),
  confirmPassword: z.string().min(12).max(128),
}).refine((fields) => fields.password === fields.confirmPassword);

export async function acceptAdminInviteWithPassword(
  _previous: AdminInviteSignupState,
  formData: FormData,
): Promise<AdminInviteSignupState> {
  const parsed = signupFields.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { ok: false, message: "Use a matching password of 12 to 128 characters." };
  const invitation = await pendingInvitation(parsed.data.token);
  if (!invitation) return { ok: false, message: "This invitation is invalid, expired or has already been used." };
  const passwordHash = await hashAdminPassword(parsed.data.password);
  const accepted = await acceptAdminInvitation(invitation.email, parsed.data.token, passwordHash);
  if (!accepted) return { ok: false, message: "This invitation is invalid, expired or has already been used." };
  return { ok: true, message: "Administrator account created. Sign in with your email and new password." };
}
