import "server-only";

import { cache } from "react";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { ensureProfileIdentity, getMatchHistoryForUser } from "@/lib/profile";

export const getOptionalViewer = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const profile = await ensureProfileIdentity({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image ?? null,
  });
  const matchHistory = await getMatchHistoryForUser(session.user.id);

  return {
    session: {
      id: session.session.id,
      expiresAt: session.session.expiresAt.toISOString(),
    },
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image ?? null,
      emailVerified: session.user.emailVerified,
    },
    profile,
    matchHistory,
  };
});

export async function requireViewer() {
  const viewer = await getOptionalViewer();

  if (!viewer) {
    redirect("/sign-in");
  }

  return viewer;
}
