import { mkdir, rename } from "node:fs/promises";
import { z } from "zod";
import type { Video } from "../src/shared/video";

const sourceSchema = z.object({
  vid: z.string().regex(/^[\w-]{11}$/),
  title: z.string().min(1),
  channel: z.string(),
  summary: z.string(),
  why_hn: z.string(),
  primary_topic: z.string(),
  content_type: z.string(),
  score: z.number().nonnegative(),
  hn: z.object({
    recommenders: z.number().int().nonnegative(),
    mentions: z.number().int().nonnegative(),
  }),
  quote: z
    .object({ text: z.string(), hn_comment_id: z.number().int().positive() })
    .nullable(),
});

const root = new URL("../data/", import.meta.url);
const supplied = Bun.argv[2];
const response = supplied
  ? null
  : await fetch("https://hackertube.org/download/videos.jsonl", {
      signal: AbortSignal.timeout(60_000),
    });
if (response && !response.ok)
  throw new Error(`Catalog download failed: ${response.status}`);
const text = supplied
  ? await Bun.file(supplied).text()
  : await response?.text();
if (!text)
  throw new Error(
    "The catalog is empty; the existing snapshot was left intact.",
  );

const videos: Video[] = text
  .trim()
  .split("\n")
  .map((line) => {
    const source = sourceSchema.parse(JSON.parse(line));
    return {
      id: source.vid,
      title: source.title,
      channel: source.channel.trim(),
      summary: source.summary,
      why: source.why_hn,
      topic: source.primary_topic,
      kind: source.content_type,
      recommendations: source.hn.recommenders,
      commentCount: source.hn.mentions,
      score: source.score,
      discussion: source.quote?.hn_comment_id ?? null,
      quote: source.quote?.text ?? null,
      ratio: null,
    };
  });
if (new Set(videos.map((video) => video.id)).size !== videos.length) {
  throw new Error(
    "Duplicate video IDs; the existing snapshot was left intact.",
  );
}
await mkdir(root, { recursive: true });
await Bun.write(
  new URL("catalog.json.tmp", root),
  `${JSON.stringify(videos)}\n`,
);
await rename(new URL("catalog.json.tmp", root), new URL("catalog.json", root));
console.info(`Imported ${videos.length.toLocaleString()} HackerTube videos.`);
