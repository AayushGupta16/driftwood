const MOCK_QUERY_KEY = "mock";
const MOCK_SESSION_KEY = "driftwood.dashboard.mock-mode";

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function normalizedMode(value: string | null): string | null {
  if (value === null) return null;
  const normalized = value.trim();
  if (!normalized || normalized === "1") return "1";
  if (["0", "off", "false"].includes(normalized.toLowerCase())) return null;
  return normalized;
}

export function initializeMockMode(
  search: string,
  pathname: string,
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null = safeStorage(),
): string | null {
  const params = new URLSearchParams(search);
  if (params.has(MOCK_QUERY_KEY)) {
    const raw = params.get(MOCK_QUERY_KEY);
    if (raw && ["0", "off", "false"].includes(raw.toLowerCase())) {
      storage?.removeItem(MOCK_SESSION_KEY);
      return null;
    }
    const explicit = normalizedMode(raw) ?? "1";
    storage?.setItem(MOCK_SESSION_KEY, explicit);
    return explicit;
  }
  if (!pathname.startsWith("/dashboard")) return null;
  return normalizedMode(storage?.getItem(MOCK_SESSION_KEY) ?? null);
}

export function activeMockMode(): string | null {
  if (typeof window === "undefined") return null;
  return initializeMockMode(window.location.search, window.location.pathname);
}

export function withMockMode(
  href: string,
  mode = activeMockMode(),
  origin = typeof window === "undefined" ? "http://localhost" : window.location.origin,
): string {
  if (!mode) return href;
  const target = new URL(href, origin);
  if (target.origin !== origin || !target.pathname.startsWith("/dashboard")) {
    return href;
  }
  target.searchParams.set(MOCK_QUERY_KEY, mode);
  return `${target.pathname}${target.search}${target.hash}`;
}

export function mockBlockedResponse(path: string): Response {
  return new Response(
    JSON.stringify({
      detail: `No mock fixture is registered for ${path}. Live API access is blocked while mock mode is active.`,
    }),
    { status: 501, headers: { "Content-Type": "application/json" } },
  );
}
