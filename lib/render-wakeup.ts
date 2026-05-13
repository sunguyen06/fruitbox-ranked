const DEFAULT_WAKE_TIMEOUT_MS = 8_000;

export interface RenderWakeResult {
  configured: boolean;
  ok: boolean;
  targetUrl: string | null;
  status: number | null;
}

export function getRenderWakeUrl(): string | null {
  const explicitUrl = normalizeUrl(process.env.RENDER_WAKE_URL);

  if (explicitUrl) {
    return explicitUrl;
  }

  const socketUrl = normalizeUrl(process.env.NEXT_PUBLIC_SOCKET_URL);

  if (!socketUrl) {
    return null;
  }

  try {
    const url = new URL(socketUrl);

    if (url.protocol === "ws:") {
      url.protocol = "http:";
    } else if (url.protocol === "wss:") {
      url.protocol = "https:";
    }

    url.pathname = "/health";
    url.search = "";
    url.hash = "";

    return url.toString();
  } catch {
    return null;
  }
}

export async function wakeRenderService(): Promise<RenderWakeResult> {
  const targetUrl = getRenderWakeUrl();

  if (!targetUrl) {
    return {
      configured: false,
      ok: false,
      targetUrl: null,
      status: null,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, DEFAULT_WAKE_TIMEOUT_MS);

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    return {
      configured: true,
      ok: response.ok,
      targetUrl,
      status: response.status,
    };
  } catch (error) {
    console.warn("[render-wakeup] failed to ping render target", error);

    return {
      configured: true,
      ok: false,
      targetUrl,
      status: null,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeUrl(value: string | undefined): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}
