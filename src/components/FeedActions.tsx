import {
  Bookmark,
  Check,
  MessageSquare,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Video } from "../shared/video";

interface Props {
  video: Video;
  seed: string;
  muted: boolean;
  bookmarked: boolean;
  onMute: () => void;
  onBookmark: () => void;
  onComments: () => void;
}

export function FeedActions({
  video,
  seed,
  muted,
  bookmarked,
  onMute,
  onBookmark,
  onComments,
}: Props) {
  const [shareState, setShareState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  useEffect(() => {
    if (shareState === "idle") return;
    const timeout = window.setTimeout(() => setShareState("idle"), 3000);
    return () => window.clearTimeout(timeout);
  }, [shareState]);

  const share = async () => {
    const url = new URL(window.location.origin);
    url.searchParams.set("v", video.id);
    url.searchParams.set("seed", seed);
    try {
      if (navigator.share)
        await navigator.share({ title: video.title, url: url.href });
      else {
        await navigator.clipboard.writeText(url.href);
        setShareState("copied");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareState("failed");
    }
  };

  return (
    <aside className="feed-actions" aria-label="Video actions">
      <button
        type="button"
        className="action-button"
        onClick={onMute}
        aria-label={muted ? "Unmute video" : "Mute video"}
        aria-pressed={!muted}
        title="Sound (M)"
      >
        <span>{muted ? <VolumeX size={23} /> : <Volume2 size={23} />}</span>
        <small>{muted ? "Sound off" : "Sound on"}</small>
      </button>
      <button
        type="button"
        className="action-button"
        onClick={onBookmark}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark video"}
        aria-pressed={bookmarked}
        title="Bookmark (B)"
      >
        <span>
          <Bookmark size={22} fill={bookmarked ? "currentColor" : "none"} />
        </span>
        <small>{bookmarked ? "Saved" : "Bookmark"}</small>
      </button>
      <button
        type="button"
        className="action-button"
        onClick={onComments}
        aria-label={`Read ${video.commentCount} Hacker News comments`}
      >
        <span>
          <MessageSquare size={22} />
        </span>
        <small>{video.commentCount} comments</small>
      </button>
      <button
        type="button"
        className="action-button"
        onClick={() => void share()}
        aria-label="Share video"
      >
        <span>
          {shareState === "copied" ? <Check size={22} /> : <Share2 size={22} />}
        </span>
        <small aria-live="polite">
          {shareState === "copied"
            ? "Copied!"
            : shareState === "failed"
              ? "Try again"
              : "Share"}
        </small>
      </button>
    </aside>
  );
}
