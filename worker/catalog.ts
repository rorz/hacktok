import catalog from "../data/catalog.json";
import commentIds from "../data/comment-ids.json";
import formats from "../data/formats.json";
import type { Video } from "../src/shared/video";

const dimensions: Record<string, { ratio: number; checked: string }> = formats;
const mentions: Readonly<Record<string, readonly number[]>> = commentIds;
const videos: readonly Video[] = catalog.map((video) => ({
  ...video,
  ratio: dimensions[video.id]?.ratio ?? null,
  commentCount: mentions[video.id]?.length ?? 0,
}));

function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state = Math.imul(state ^ seed.charCodeAt(index), 16777619);
  }
  // Mulberry32 supplies repeatable draws for Fisher–Yates; this is not a security token.
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffledVideos(seed: string, first: string | null): Video[] {
  const random = seededRandom(seed);
  const ordered = [...videos];
  for (let index = ordered.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    const current = ordered[index];
    const replacement = ordered[target];
    if (!current || !replacement) throw new Error("Invalid shuffle index.");
    ordered[index] = replacement;
    ordered[target] = current;
  }
  const firstIndex = first
    ? ordered.findIndex((video) => video.id === first)
    : -1;
  // Rotate, rather than move a single item, so a current-video URL resumes the same sequence.
  return firstIndex > 0
    ? [...ordered.slice(firstIndex), ...ordered.slice(0, firstIndex)]
    : ordered;
}
