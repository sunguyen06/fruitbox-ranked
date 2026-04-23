"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { signIn } from "@/lib/auth-client";
import { AuthCard } from "@/components/auth/auth-card";

interface SignInFormProps {
  nextPath: string;
}

export function SignInForm({ nextPath }: SignInFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <AuthCard
      title="Sign In"
      description="Use your Fruitbox account to keep your identity, profile, and future matchmaking data attached to every room and match."
      footerLabel="Need an account?"
      footerHref={buildAuthHref("/sign-up", nextPath)}
      footerText="Create one"
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const username = String(formData.get("username") ?? "");
          const password = String(formData.get("password") ?? "");

          startTransition(async () => {
            setErrorMessage(null);
            const result = await signIn.username({
              username,
              password,
              rememberMe: true,
            });

            if (result.error) {
              setErrorMessage(result.error.message ?? "Unable to sign in.");
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
          autoComplete="current-password"
          placeholder="Enter your password"
        />

        {errorMessage ? (
          <div className="rounded-[1.4rem] border border-[#ffd28f]/22 bg-[#6a4e1f]/18 px-4 py-3 text-sm text-[#ffd9a5]">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-[1.25rem] bg-[linear-gradient(135deg,#ff8f3f,#ffb347)] px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_18px_45px_rgba(255,143,63,0.3)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:brightness-75"
        >
          {isPending ? "Signing In..." : "Sign In"}
        </button>

        <p className="text-center text-xs text-[#f0d7bc]">
          Public queues still come next. This account step keeps private rooms intact while making room ownership and history persistent.
        </p>
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
