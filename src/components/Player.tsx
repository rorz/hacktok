import {
  ArrowUpRight,
  LoaderCircle,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { useEffect } from "react";
import { usePlayer } from "../hooks/use-player";
import { formatTime } from "../lib/youtube";
import type { Video } from "../shared/video";

interface Props {
  video: Video;
  muted: boolean;
  suspended: boolean;
  onEnded: () => void;
  onUnavailable: (id: string) => void;
}

export function Player({
  video,
  muted,
  suspended,
  onEnded,
  onUnavailable,
}: Props) {
  const player = usePlayer(video.id, muted, suspended, onEnded, onUnavailable);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        suspended ||
        event.code !== "Space" ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey
      )
        return;
      if (
        event.target instanceof Element &&
        event.target.closest(
          "dialog, button, a, input, textarea, select, [contenteditable]",
        )
      )
        return;
      event.preventDefault();
      player.toggle();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [player.toggle, suspended]);

  return (
    <>
      <div className="video-stage">
        <img
          className="ambient-frame"
          src={`https://i.ytimg.com/vi/${video.id}/hq2.jpg`}
          alt=""
          aria-hidden="true"
        />
        <div className="stage-shade" />
        <div
          className="embed-frame"
          style={
            { "--video-ratio": video.ratio ?? 16 / 9 } as React.CSSProperties
          }
        >
          {!player.ready && !player.error && (
            <div className="player-loading" role="status">
              <LoaderCircle size={22} className="animate-spin" />
              <span>Finding the good stuff</span>
            </div>
          )}
          <div className="youtube-host" ref={player.host} />
        </div>
        {!player.error && (
          <button
            type="button"
            className="video-tap"
            onClick={player.toggle}
            disabled={!player.ready}
            aria-label={player.playing ? "Pause playback" : "Start playback"}
          >
            {player.ready && !player.playing && (
              <span className="center-play">
                <Play size={34} fill="currentColor" />
              </span>
            )}
          </button>
        )}
        {player.error && (
          <div className="player-error" role="alert">
            <span className="error-symbol">
              <Play size={24} />
            </span>
            <h3>A small intermission.</h3>
            <p>{player.error}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={player.retry}
                className="small-button"
              >
                <RotateCcw size={14} /> Retry
              </button>
              <a
                className="small-button primary"
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noreferrer"
              >
                YouTube <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        )}
      </div>
      <div className="playback-bar">
        <button
          type="button"
          className="play-toggle"
          aria-label={player.playing ? "Pause video" : "Play video"}
          onClick={player.toggle}
          disabled={!player.ready || Boolean(player.error)}
        >
          {player.playing ? (
            <Pause size={17} fill="currentColor" />
          ) : (
            <Play size={17} fill="currentColor" />
          )}
        </button>
        <span className="playback-time">{formatTime(player.elapsed)}</span>
        <input
          aria-label="Seek video"
          type="range"
          min={0}
          max={player.duration || 1}
          step={1}
          value={Math.min(player.elapsed, player.duration || 1)}
          disabled={!player.ready || !player.duration || Boolean(player.error)}
          onChange={(event) => player.seek(Number(event.target.value))}
          style={
            {
              "--progress": `${player.duration ? (player.elapsed / player.duration) * 100 : 0}%`,
            } as React.CSSProperties
          }
        />
        <span className="playback-time">
          {player.duration ? formatTime(player.duration) : "—:—"}
        </span>
      </div>
      {player.blocked && !player.error && (
        <button
          type="button"
          className="autoplay-notice"
          onClick={player.toggle}
        >
          <Play size={13} /> Tap play to start watching
        </button>
      )}
    </>
  );
}
