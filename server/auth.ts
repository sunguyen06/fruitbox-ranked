import type { IncomingHttpHeaders } from "node:http";

import { prisma } from "@/lib/db";
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
  sessionToken?: unknown,
): Promise<AuthenticatedSocketUser | null> {
  const user =
    (typeof sessionToken === "string" ? await findUserBySessionToken(sessionToken) : null) ??
    (await findUserBySignedCookieHeaders(requestHeaders));

  if (!user) {
    return null;
  }

  const profile = await ensureProfileIdentity({
    userId: user.id,
    email: user.email,
    name: user.name,
    image: user.image ?? null,
  });

  return {
    userId: user.id,
    email: user.email,
    displayName: profile.displayName,
    handle: profile.handle,
    image: user.image ?? null,
  };
}

async function findUserBySessionToken(sessionToken: string) {
  const session = await prisma.session.findUnique({
    where: {
      token: sessionToken,
    },
    include: {
      user: true,
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    return null;
  }

  return session.user;
}

async function findUserBySignedCookieHeaders(requestHeaders: IncomingHttpHeaders) {
  const { auth } = await import("@/lib/auth");
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

  return session?.user ?? null;
}
