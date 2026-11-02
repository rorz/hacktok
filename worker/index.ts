import type { FeedPage } from "../src/shared/video";
import { shuffledVideos } from "./catalog";
import { loadComments } from "./comments";

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": status === 200 ? "public, max-age=3600" : "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (request.method !== "GET") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET" },
      });
    }
    const commentsMatch = /^\/api\/comments\/([\w-]{11})$/.exec(url.pathname);
    const commentVideo = commentsMatch?.[1];
    if (commentVideo) {
      const page = await loadComments(commentVideo);
      if (!page) return json({ error: "Video not found" }, 404);
      return Response.json(page, {
        headers: {
          "Cache-Control": page.failed ? "no-store" : "public, max-age=300",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    if (url.pathname !== "/api/feed") return json({ error: "Not found" }, 404);

    const offset = Number(url.searchParams.get("offset") ?? 0);
    const seed = url.searchParams.get("seed") ?? "hacktok";
    const first = url.searchParams.get("first");
    if (
      !Number.isInteger(offset) ||
      offset < 0 ||
      offset > 10_000 ||
      !/^[\w-]{1,40}$/.test(seed) ||
      (first !== null && !/^[\w-]{11}$/.test(first))
    ) {
      return json({ error: "Invalid feed parameters" }, 400);
    }
    const ordered = shuffledVideos(seed, first);
    const videos = ordered.slice(offset, offset + 20);
    const page: FeedPage = {
      videos,
      total: ordered.length,
      next:
        offset + videos.length < ordered.length ? offset + videos.length : null,
    };
    return json(page);
  },
} satisfies ExportedHandler<Env>;
