import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ sessionToken: null }, { status: 401 });
  }

  return NextResponse.json(
    {
      sessionToken: session.session.token,
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
