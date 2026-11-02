import { z } from "zod";
import commentIds from "../data/comment-ids.json";
import type { CommentsPage, HnComment } from "../src/shared/comments";

const mentions: Readonly<Record<string, readonly number[]>> = commentIds;
const itemSchema = z
  .object({
    id: z.number().int().positive(),
    type: z.string().optional(),
    by: z.string().optional(),
    time: z.number().nonnegative().optional(),
    text: z.string().optional(),
    deleted: z.boolean().optional(),
    dead: z.boolean().optional(),
  })
  .nullable();

async function loadComment(id: number): Promise<HnComment> {
  const empty: HnComment = {
    id,
    author: null,
    time: null,
    html: "",
    status: "unavailable",
  };
  try {
    const response = await fetch(
      `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      {
        signal: AbortSignal.timeout(4000),
        cf: { cacheTtl: 300, cacheEverything: true },
      },
    );
    if (!response.ok) throw new Error(`HN returned ${response.status}`);
    const item = itemSchema.parse(await response.json());
    if (!item) return { ...empty, status: "deleted" };
    if (item.id !== id || (item.type && item.type !== "comment"))
      throw new Error("Unexpected HN item.");
    return {
      id,
      author: item.by ?? null,
      time: item.time ?? null,
      html: item.deleted || item.dead ? "" : (item.text ?? ""),
      status: item.deleted || item.dead || !item.text ? "deleted" : "available",
    };
  } catch (error) {
    console.warn(
      JSON.stringify({
        message: "HN comment unavailable",
        id,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return empty;
  }
}

export async function loadComments(
  videoId: string,
): Promise<CommentsPage | null> {
  const ids = Object.hasOwn(mentions, videoId) ? mentions[videoId] : undefined;
  if (!ids) return null;
  const comments: HnComment[] = [];
  // Keep outbound concurrency within the Worker's connection limit.
  for (let offset = 0; offset < ids.length; offset += 6) {
    comments.push(
      ...(await Promise.all(ids.slice(offset, offset + 6).map(loadComment))),
    );
  }
  comments.sort((a, b) => (b.time ?? 0) - (a.time ?? 0) || b.id - a.id);
  return {
    comments,
    total: ids.length,
    failed: comments.filter((comment) => comment.status === "unavailable")
      .length,
  };
}
