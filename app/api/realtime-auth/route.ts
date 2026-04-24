import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  try {
    const { auth } = await import("@/lib/auth");
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
  } catch (error) {
    console.error("[realtime-auth] failed to resolve session token", error);

    return NextResponse.json({ sessionToken: null }, { status: 503 });
  }
}
