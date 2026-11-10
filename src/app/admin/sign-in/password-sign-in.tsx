"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const fieldClass = "mt-2 min-h-12 w-full rounded-xl border border-[#dfe2ec] bg-[#fbfbfd] px-3.5 text-sm text-ink outline-none transition placeholder:text-[#9aa1b2] focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10";

export function PasswordSignIn() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", {
        email: form.get("email"),
        password: form.get("password"),
        redirect: false,
      });
      if (!result?.ok) {
        setError("Sign-in failed. Check your credentials, account access, or try again later.");
        setPending(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Unable to sign in right now. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium text-ink">Email address
        <input name="email" type="email" required maxLength={254} autoComplete="username" className={fieldClass} />
      </label>
      <label className="block text-sm font-medium text-ink">Password
        <input name="password" type="password" required maxLength={128} autoComplete="current-password" className={fieldClass} />
      </label>
      <button disabled={pending} className="min-h-12 w-full rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(79,70,229,0.8)] outline-none transition hover:bg-[#4338ca] focus-visible:ring-4 focus-visible:ring-brand/20 disabled:opacity-50">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-down">{error}</p>}
    </form>
  );
}
