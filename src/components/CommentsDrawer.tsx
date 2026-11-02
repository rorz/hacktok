import { ArrowUpRight, LoaderCircle, RotateCcw } from "lucide-react";
import { useComments } from "../hooks/use-comments";
import type { Video } from "../shared/video";
import { CommentText } from "./CommentText";
import { SideDrawer } from "./SideDrawer";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

export function CommentsDrawer({
  video,
  onClose,
}: {
  video: Video;
  onClose: () => void;
}) {
  const { page, loading, error, retry } = useComments(video.id);

  return (
    <SideDrawer
      id="comments-drawer"
      title="Comments"
      count={page?.total ?? video.commentCount}
      meta="from Hacker News"
      onClose={onClose}
    >
      {loading && !page && (
        <div className="comments-status" role="status">
          <LoaderCircle size={22} className="animate-spin" />
          <span>Loading comments</span>
        </div>
      )}
      {error && (
        <div className="comments-status" role="alert">
          <p>{error}</p>
          <button type="button" className="small-button" onClick={retry}>
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      )}
      {page && (
        <ol className="comments-list">
          {page.comments.map((comment) => (
            <li key={comment.id} className="comment">
              <span className="comment-avatar" aria-hidden="true">
                {comment.author?.charAt(0).toUpperCase() ?? "—"}
              </span>
              <div className="comment-content">
                <div className="comment-byline">
                  {comment.author ? (
                    <a
                      className="comment-author"
                      href={`https://news.ycombinator.com/user?id=${encodeURIComponent(comment.author)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {comment.author}
                    </a>
                  ) : (
                    <span className="comment-author">
                      {comment.status === "deleted" ? "Deleted" : "Hacker News"}
                    </span>
                  )}
                  {comment.time && (
                    <time
                      dateTime={new Date(comment.time * 1000).toISOString()}
                    >
                      {dateFormat.format(comment.time * 1000)}
                    </time>
                  )}
                  <a
                    className="comment-permalink"
                    href={`https://news.ycombinator.com/item?id=${comment.id}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open comment ${comment.id} on Hacker News`}
                  >
                    <ArrowUpRight size={14} />
                  </a>
                </div>
                {comment.status === "available" ? (
                  <CommentText html={comment.html} />
                ) : (
                  <p className="comment-unavailable">
                    {comment.status === "deleted"
                      ? "This comment was removed."
                      : "This comment couldn’t load."}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      {page?.total === 0 && (
        <p className="comments-status">No comments for this video.</p>
      )}
      {page && page.failed > 0 && (
        <button
          type="button"
          className="comments-retry small-button"
          onClick={retry}
          disabled={loading}
        >
          {loading ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : (
            <RotateCcw size={14} />
          )}{" "}
          Retry {page.failed} comments
        </button>
      )}
    </SideDrawer>
  );
}
