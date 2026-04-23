import type { IncomingHttpHeaders } from "node:http";

import { auth } from "@/lib/auth";
import { ensureProfileIdentity } from "@/lib/profile";

export interface AuthenticatedSocketUser {
  userId: string;
  email: string;
  displayName: string;
  handle: string;
  image: string | null;
}

export async function authenticateSocketUser(
  requestHeaders: IncomingHttpHeaders,
): Promise<AuthenticatedSocketUser | null> {
  const headers = new Headers();

  for (const [key, value] of Object.entries(requestHeaders)) {
    if (typeof value === "string") {
      headers.set(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      headers.set(key, value.join(", "));
    }
  }

  const session = await auth.api.getSession({ headers });

  if (!session) {
    return null;
  }

  const profile = await ensureProfileIdentity({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image ?? null,
  });

  return {
    userId: session.user.id,
    email: session.user.email,
    displayName: profile.displayName,
    handle: profile.handle,
    image: session.user.image ?? null,
  };
}
