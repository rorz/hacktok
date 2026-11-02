import { ArrowUpRight } from "lucide-react";
import type { Video } from "../shared/video";
import { Player } from "./Player";

interface Props {
  video: Video;
  active: boolean;
  muted: boolean;
  suspended: boolean;
  onEnded: () => void;
  onUnavailable: (id: string) => void;
}

export function VideoCard({
  video,
  active,
  muted,
  suspended,
  onEnded,
  onUnavailable,
}: Props) {
  return (
    <article
      className="video-card"
      aria-label={video.title}
      aria-hidden={!active}
      inert={!active}
    >
      {active ? (
        <Player
          video={video}
          muted={muted}
          suspended={suspended}
          onEnded={onEnded}
          onUnavailable={onUnavailable}
        />
      ) : (
        <div className="video-stage poster-stage">
          <img
            src={`https://i.ytimg.com/vi/${video.id}/hq2.jpg`}
            alt=""
            loading="lazy"
          />
        </div>
      )}
      <div className="video-caption">
        <span className="topic-tag">
          <span />
          {video.topic}
        </span>
        <div className="channel-line">
          {video.channel || "Independent creator"}
        </div>
        <h1>{video.title}</h1>
        <p className="video-summary">{video.summary}</p>
        <div className="caption-footer">
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Watch original video on YouTube"
          >
            Original <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </article>
  );
}
