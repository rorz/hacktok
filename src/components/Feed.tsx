import { ArrowDown, ArrowUp, LoaderCircle, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useFeed } from "../hooks/use-feed";
import { useViewport } from "../hooks/use-viewport";
import type { Video } from "../shared/video";
import { FeedActions } from "./FeedActions";
import { VideoCard } from "./VideoCard";

interface Props {
  muted: boolean;
  rotated: boolean;
  suspended: boolean;
  onMute: () => void;
  onRotate: () => void;
  onComments: (video: Video) => void;
  overlayOpen: boolean;
  bookmarkIds: ReadonlySet<string>;
  onBookmark: (video: Video, seed: string) => void;
}

export function Feed({
  muted,
  rotated,
  suspended,
  onMute,
  onRotate,
  onComments,
  overlayOpen,
  bookmarkIds,
  onBookmark,
}: Props) {
  const [{ seed, first }] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSeed = params.get("seed");
    const requestedVideo = params.get("v");
    return {
      seed:
        requestedSeed && /^[\w-]{1,40}$/.test(requestedSeed)
          ? requestedSeed
          : crypto.randomUUID(),
      first:
        requestedVideo && /^[\w-]{11}$/.test(requestedVideo)
          ? requestedVideo
          : null,
    };
  });
  const feed = useFeed(seed, first);
  const viewport = useViewport(feed.videos.length);
  const video = feed.videos[viewport.active];
  const start = Math.max(0, viewport.active - 1);
  const end = Math.min(feed.videos.length, viewport.active + 3);
  const next = useCallback(() => {
    if (!overlayOpen) viewport.go(1);
  }, [viewport.go, overlayOpen]);

  useEffect(() => {
    if (!video) return;
    const url = new URL(window.location.href);
    url.searchParams.set("v", video.id);
    url.searchParams.set("seed", seed);
    window.history.replaceState(window.history.state, "", url);
  }, [video, seed]);

  useEffect(() => {
    if (
      viewport.active >= feed.videos.length - 5 &&
      !feed.loading &&
      !feed.error
    )
      feed.loadMore();
  }, [
    viewport.active,
    feed.videos.length,
    feed.loading,
    feed.error,
    feed.loadMore,
  ]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (overlayOpen || event.altKey || event.metaKey || event.ctrlKey) return;
      if (
        event.target instanceof Element &&
        event.target.closest("input, textarea, select, [contenteditable]")
      )
        return;
      if (event.key === "ArrowDown" || event.key === "j") {
        event.preventDefault();
        viewport.go(1);
      }
      if (event.key === "ArrowUp" || event.key === "k") {
        event.preventDefault();
        viewport.go(-1);
      }
      if (event.key.toLowerCase() === "m") onMute();
      if (event.key.toLowerCase() === "r") onRotate();
      if (event.key.toLowerCase() === "b" && video && !event.repeat) {
        event.preventDefault();
        onBookmark(video, seed);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewport.go, overlayOpen, onMute, onRotate, onBookmark, video, seed]);

  return (
    <main className={`feed-shell ${rotated ? "is-rotated" : ""}`}>
      <section
        className="feed-scroll"
        ref={viewport.scroller}
        onScroll={viewport.onScroll}
        aria-label="Video feed"
      >
        <div style={{ height: start * viewport.height }} aria-hidden="true" />
        {feed.videos.slice(start, end).map((item, index) => (
          <section
            className="feed-page"
            key={item.id}
            style={{ height: viewport.height }}
          >
            <VideoCard
              video={item}
              active={start + index === viewport.active}
              muted={muted}
              suspended={suspended}
              onEnded={next}
              onUnavailable={feed.exclude}
            />
          </section>
        ))}
        <div
          style={{
            height: Math.max(0, feed.videos.length - end) * viewport.height,
          }}
          aria-hidden="true"
        />
      </section>

      {!video && (
        <div className="feed-status" role="status">
          {feed.error ? (
            <>
              <span className="eyebrow">A small detour</span>
              <h1>Let’s try that again.</h1>
              <p>{feed.error}</p>
              <button
                type="button"
                className="small-button primary"
                onClick={feed.loadMore}
              >
                <RotateCcw size={16} /> Reload feed
              </button>
            </>
          ) : feed.next === null && !feed.loading ? (
            <h1>No playable videos right now.</h1>
          ) : (
            <>
              <LoaderCircle size={25} className="animate-spin text-lime" />
              <p>Opening the rabbit hole…</p>
            </>
          )}
        </div>
      )}

      {video && (
        <>
          <div className="feed-position" aria-hidden="true">
            <span className="position-line" />
            <span className="current-position">
              {String(viewport.active + 1).padStart(3, "0")}
            </span>
            <span className="position-divider">/</span>
            <span>{feed.total.toLocaleString("en-US")}</span>
          </div>
          <div className="action-position">
            <FeedActions
              key={video.id}
              video={video}
              seed={seed}
              muted={muted}
              bookmarked={bookmarkIds.has(video.id)}
              onMute={onMute}
              onBookmark={() => onBookmark(video, seed)}
              onComments={() => onComments(video)}
            />
          </div>
          <nav className="feed-navigation" aria-label="Navigate videos">
            <button
              type="button"
              aria-label="Previous video"
              title="Previous video (↑)"
              onClick={() => viewport.go(-1)}
              disabled={viewport.active === 0}
            >
              <ArrowUp size={21} />
            </button>
            <button
              type="button"
              aria-label="Next video"
              title="Next video (↓)"
              onClick={next}
              disabled={viewport.active >= feed.videos.length - 1}
            >
              <ArrowDown size={21} />
            </button>
          </nav>
          <div className="sr-only" aria-live="polite">
            Video {viewport.active + 1}: {video.title}
          </div>
          {feed.error && (
            <div className="feed-notice" role="alert">
              Couldn’t load the next videos.{" "}
              <button type="button" onClick={feed.loadMore}>
                Try again
              </button>
            </div>
          )}
          {feed.next === null && viewport.active === feed.videos.length - 1 && (
            <div className="feed-notice">
              You’ve explored the collection.{" "}
              <button
                type="button"
                onClick={() => viewport.go(-viewport.active)}
              >
                Back to the beginning
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
