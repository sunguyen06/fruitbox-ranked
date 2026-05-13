import { NextResponse } from "next/server";

import { wakeRenderService } from "@/lib/render-wakeup";

export const runtime = "nodejs";

export async function POST() {
  const result = await wakeRenderService();

  return NextResponse.json(result, {
    status: 200,
    headers: {
      "cache-control": "no-store",
    },
  });
}
