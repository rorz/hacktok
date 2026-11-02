import { useCallback, useEffect, useRef, useState } from "react";
import { createUnavailableStore } from "../lib/unavailable";
import type { FeedPage, Video } from "../shared/video";

interface FeedState {
  videos: Video[];
  total: number;
  next: number | null;
  loading: boolean;
  error: string | null;
}

const initial: FeedState = {
  videos: [],
  total: 0,
  next: 0,
  loading: true,
  error: null,
};

export function useFeed(seed: string, first: string | null) {
  const [state, setState] = useState(initial);
  const [unavailable] = useState(createUnavailableStore);
  const request = useRef<AbortController | null>(null);

  const load = useCallback(
    async (offset: number) => {
      if (request.current) return;
      const controller = new AbortController();
      request.current = controller;
      setState((previous) => ({ ...previous, loading: true, error: null }));
      try {
        const params = new URLSearchParams({
          seed,
          offset: String(offset),
        });
        if (first) params.set("first", first);
        const response = await fetch(`/api/feed?${params}`, {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(15_000),
          ]),
        });
        if (!response.ok)
          throw new Error(`The feed is unavailable (${response.status}).`);
        const page: FeedPage = await response.json();
        if (controller.signal.aborted) return;
        const playable = page.videos.filter(
          (video) => !unavailable.has(video.id),
        );
        setState((previous) => ({
          ...page,
          total: Math.max(0, page.total - unavailable.count()),
          videos: offset === 0 ? playable : [...previous.videos, ...playable],
          loading: false,
          error: null,
        }));
      } catch (error) {
        if (controller.signal.aborted) return;
        setState((previous) => ({
          ...previous,
          loading: false,
          error:
            error instanceof Error ? error.message : "Could not load the feed.",
        }));
      } finally {
        if (request.current === controller) request.current = null;
      }
    },
    [seed, first, unavailable],
  );

  useEffect(() => {
    setState(initial);
    void load(0);
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [load]);

  const loadMore = useCallback(() => {
    if (state.next !== null) void load(state.next);
  }, [load, state.next]);

  const exclude = useCallback(
    (id: string) => {
      if (unavailable.has(id)) return;
      unavailable.remember(id);
      setState((previous) => ({
        ...previous,
        videos: previous.videos.filter((video) => video.id !== id),
        total: Math.max(0, previous.total - 1),
      }));
    },
    [unavailable],
  );

  return { ...state, loadMore, exclude };
}
