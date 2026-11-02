import { rename } from "node:fs/promises";
import { z } from "zod";
import catalog from "../data/catalog.json";

const mentionSchema = z.object({
  vid: z.string().regex(/^[\w-]{11}$/),
  hn_comment_id: z.number().int().positive(),
});
const source = Bun.argv[2];
const response = source
  ? null
  : await fetch("https://hackertube.org/download/mentions.jsonl", {
      signal: AbortSignal.timeout(90_000),
    });
if (response && !response.ok)
  throw new Error(`Comments download failed: ${response.status}`);
const text = source ? await Bun.file(source).text() : await response?.text();
if (!text)
  throw new Error(
    "The comments export is empty; the existing index was left intact.",
  );

const allowed = new Set(catalog.map((video) => video.id));
const grouped = new Map<string, Set<number>>();
for (const line of text.trim().split("\n")) {
  const mention = mentionSchema.parse(JSON.parse(line));
  if (!allowed.has(mention.vid)) continue;
  const ids = grouped.get(mention.vid) ?? new Set<number>();
  ids.add(mention.hn_comment_id);
  grouped.set(mention.vid, ids);
}
const index = Object.fromEntries(
  [...grouped].map(([video, ids]) => [video, [...ids].sort((a, b) => b - a)]),
);
const temporary = new URL("../data/comment-ids.json.tmp", import.meta.url);
await Bun.write(temporary, `${JSON.stringify(index)}\n`);
await rename(temporary, new URL("../data/comment-ids.json", import.meta.url));
console.info(
  `Indexed ${[...grouped.values()].reduce((total, ids) => total + ids.size, 0)} comments across ${grouped.size} videos.`,
);
