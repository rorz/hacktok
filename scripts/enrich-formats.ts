import { rename } from "node:fs/promises";
import { z } from "zod";
import catalog from "../data/catalog.json";

const dimensionsSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});
const cacheSchema = z.record(
  z.string(),
  z.object({ ratio: z.number().positive(), checked: z.string() }),
);
const file = new URL("../data/formats.json", import.meta.url);
const cache = cacheSchema.parse(await Bun.file(file).json());
const limit = Number(Bun.argv[2] ?? 200);
if (!Number.isInteger(limit) || limit < 1)
  throw new Error("Pass a positive number of videos to inspect.");
const staleBefore = Date.now() - 30 * 24 * 60 * 60 * 1000;
const queue = catalog
  .filter((video) => {
    const entry = cache[video.id];
    return !entry || Date.parse(entry.checked) < staleBefore;
  })
  .slice(0, limit);
let completed = 0;
let halted = false;

async function inspect() {
  while (!halted) {
    const video = queue.shift();
    if (!video) return;
    const url = new URL("https://www.youtube.com/oembed");
    url.searchParams.set("url", `https://www.youtube.com/watch?v=${video.id}`);
    url.searchParams.set("format", "json");
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status === 429) {
        halted = true;
        console.warn(
          "YouTube rate limited this run; stopping and retaining measured formats.",
        );
        return;
      }
      if (!response.ok) {
        console.warn(
          `${video.id}: oEmbed returned ${response.status}; format remains unknown.`,
        );
      } else {
        const dimensions = dimensionsSchema.parse(await response.json());
        cache[video.id] = {
          ratio: dimensions.width / dimensions.height,
          checked: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.warn(
        `${video.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    completed += 1;
    if (completed % 100 === 0)
      console.info(`Inspected ${completed}; ${queue.length} remaining.`);
    await Bun.sleep(150);
  }
}

await Promise.all(Array.from({ length: 4 }, inspect));
await Bun.write(
  new URL("../data/formats.json.tmp", import.meta.url),
  `${JSON.stringify(cache)}\n`,
);
await rename(new URL("../data/formats.json.tmp", import.meta.url), file);
const upright = Object.values(cache).filter(
  ({ ratio }) => ratio <= 1.15,
).length;
console.info(
  `${Object.keys(cache).length} formats measured; ${upright} portrait or square.`,
);
