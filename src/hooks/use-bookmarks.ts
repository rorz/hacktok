import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Video } from "../shared/video";

export interface BookmarkEntry {
  id: string;
  title: string;
  channel: string;
  seed: string;
}

const storageKey = "hacktok:bookmarks:v1";

function parseBookmarks(raw: string | null): BookmarkEntry[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(value)) return [];
    const entries = new Map<string, BookmarkEntry>();
    for (const item of value) {
      if (
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        /^[\w-]{11}$/.test(item.id) &&
        typeof item.title === "string" &&
        typeof item.channel === "string" &&
        typeof item.seed === "string" &&
        /^[\w-]{1,40}$/.test(item.seed)
      ) {
        entries.set(item.id, {
          id: item.id,
          title: item.title,
          channel: item.channel,
          seed: item.seed,
        });
      }
    }
    return [...entries.values()];
  } catch (error) {
    console.warn("Could not parse saved bookmarks.", error);
    return [];
  }
}

function readBookmarks(): BookmarkEntry[] {
  try {
    return parseBookmarks(localStorage.getItem(storageKey));
  } catch (error) {
    console.warn("Could not read saved bookmarks.", error);
    return [];
  }
}

export function useBookmarks() {
  const [items, setItems] = useState(readBookmarks);
  const [storageError, setStorageError] = useState(false);
  const current = useRef(items);
  const ids = useMemo(() => new Set(items.map((item) => item.id)), [items]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return;
      if (event.storageArea !== localStorage) return;
      const next = parseBookmarks(event.newValue);
      current.current = next;
      setItems(next);
      setStorageError(false);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const save = useCallback((next: BookmarkEntry[]) => {
    current.current = next;
    setItems(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageError(false);
    } catch (error) {
      console.warn(
        "Could not save bookmarks; keeping them for this visit.",
        error,
      );
      setStorageError(true);
    }
  }, []);

  const toggle = useCallback(
    (video: Video, seed: string) => {
      const previous = current.current;
      save(
        previous.some((item) => item.id === video.id)
          ? previous.filter((item) => item.id !== video.id)
          : [
              {
                id: video.id,
                title: video.title,
                channel: video.channel,
                seed,
              },
              ...previous,
            ],
      );
    },
    [save],
  );
  const remove = useCallback(
    (id: string) => save(current.current.filter((item) => item.id !== id)),
    [save],
  );

  return { items, ids, toggle, remove, storageError };
}
