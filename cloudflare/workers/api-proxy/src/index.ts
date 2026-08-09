export interface Env {
  UPSTREAM_ORIGIN: string;
}

const WINDOW_MS = 60_000;
const MAX_AI = 20;
const hits = new Map<string, { count: number; ts: number }>();

function limited(ip: string, max: number) {
  const now = Date.now();
  const cur = hits.get(ip);
  if (!cur || now - cur.ts > WINDOW_MS) {
    hits.set(ip, { count: 1, ts: now });
    return false;
  }
  cur.count += 1;
  return cur.count > max;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const ip = request.headers.get("cf-connecting-ip") ?? "unknown";

    if (url.pathname.startsWith("/api/ai/") || url.pathname.startsWith("/api/auth/")) {
      if (limited(ip, MAX_AI)) {
        return new Response(JSON.stringify({ error: "Rate limit" }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Não cachear dados privados
    const cacheable =
      url.pathname.startsWith("/exercises") ||
      url.pathname.match(/\.(js|css|png|jpg|webp|svg)$/);

    const upstream = new URL(url.pathname + url.search, env.UPSTREAM_ORIGIN);
    const res = await fetch(new Request(upstream, request));
    const headers = new Headers(res.headers);
    if (cacheable) {
      headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    } else {
      headers.set("Cache-Control", "private, no-store");
    }
    return new Response(res.body, { status: res.status, headers });
  },
};
