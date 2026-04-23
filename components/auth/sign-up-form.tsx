"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { signUp } from "@/lib/auth-client";
import { AuthCard } from "@/components/auth/auth-card";

interface SignUpFormProps {
  nextPath: string;
}

export function SignUpForm({ nextPath }: SignUpFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <AuthCard
      title="Create Account"
      description="Set up a persistent Fruitbox identity so private rooms, profile data, and future casual and ranked matchmaking all point at the same player account."
      footerLabel="Already have an account?"
      footerHref={buildAuthHref("/sign-in", nextPath)}
      footerText="Sign in"
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const username = String(formData.get("username") ?? "").trim();

          startTransition(async () => {
            setErrorMessage(null);
            const result = await signUp.email({
              name: username,
              email: createInternalEmailFromUsername(username),
              password: String(formData.get("password") ?? ""),
              username,
              displayUsername: username,
            });

            if (result.error) {
              setErrorMessage(result.error.message ?? "Unable to create your account.");
              return;
            }

            router.replace(nextPath);
            router.refresh();
          });
        }}
      >
        <AuthField
          id="username"
          label="Username"
          type="text"
          autoComplete="username"
          placeholder="fruitboxplayer"
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />

        {errorMessage ? (
          <div className="rounded-[1.4rem] border border-[#ffd28f]/22 bg-[#6a4e1f]/18 px-4 py-3 text-sm text-[#ffd9a5]">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-[1.25rem] bg-[linear-gradient(135deg,#2f9a54,#61c977)] px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_18px_45px_rgba(47,154,84,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:brightness-75"
        >
          {isPending ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </AuthCard>
  );
}

function AuthField({
  id,
  label,
  type,
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-3">
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-[0.26em] text-[#f9deb6]"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        minLength={id === "password" ? 8 : undefined}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-[1.4rem] border border-white/12 bg-white/[0.08] px-5 py-4 text-base text-white outline-none transition placeholder:text-white/24 focus:border-[#ffb347] focus:bg-white/10"
      />
    </div>
  );
}

function buildAuthHref(pathname: string, nextPath: string) {
  return nextPath && nextPath !== "/" ? `${pathname}?next=${encodeURIComponent(nextPath)}` : pathname;
}

function createInternalEmailFromUsername(username: string) {
  const normalized = username.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "_");
  return `${normalized || "player"}@users.fruitbox.local`;
}
