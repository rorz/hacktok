import { Bookmark, Info } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import mark from "./assets/mark.svg";
import { BookmarksDrawer } from "./components/BookmarksDrawer";
import { CommentsDrawer } from "./components/CommentsDrawer";
import { Feed } from "./components/Feed";
import { InfoDialog } from "./components/InfoDialog";
import { useBookmarks } from "./hooks/use-bookmarks";
import type { Video } from "./shared/video";

export function App() {
  const [muted, setMuted] = useState(false);
  const [rotated, setRotated] = useState(false);
  const [uiHidden, setUiHidden] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const bookmarks = useBookmarks();
  const [commentVideo, setCommentVideo] = useState<Video | null>(null);
  const toggleMuted = useCallback(() => setMuted((value) => !value), []);
  const toggleRotation = useCallback(() => setRotated((value) => !value), []);
  const closeAbout = useCallback(() => setAboutOpen(false), []);
  const closeComments = useCallback(() => setCommentVideo(null), []);
  const closeBookmarks = useCallback(() => setBookmarksOpen(false), []);
  const toggleUI = useCallback(() => {
    setUiHidden((value) => !value);
    setAboutOpen(false);
    setBookmarksOpen(false);
    setCommentVideo(null);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "u" ||
        event.repeat ||
        event.isComposing ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey ||
        (event.target instanceof Element &&
          event.target.closest("input, textarea, select, [contenteditable]"))
      )
        return;
      event.preventDefault();
      toggleUI();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [toggleUI]);

  return (
    <div className={`app ${uiHidden ? "ui-hidden" : ""}`}>
      <header className="site-header">
        <div className="brand-lockup">
          <a href="/" className="brand" aria-label="HackTok home">
            <img src={mark} width={32} height={32} alt="" />
            <span>
              HackTok<span className="brand-period">.</span>
            </span>
          </a>
          <button
            type="button"
            className="ui-toggle"
            onClick={toggleUI}
            aria-pressed={uiHidden}
            aria-keyshortcuts="U"
            title={`${uiHidden ? "Show" : "Hide"} UI (U)`}
          >
            {uiHidden ? "Show UI" : "Hide UI"}
          </button>
        </div>
        <div className="header-right">
          <button
            type="button"
            className="header-button bookmarks-button"
            onClick={() => setBookmarksOpen(true)}
            aria-label="Open bookmarks"
            aria-haspopup="dialog"
            aria-expanded={bookmarksOpen}
            aria-controls="bookmarks-drawer"
            title="Bookmarks"
          >
            <Bookmark size={18} />
            {bookmarks.items.length > 0 && (
              <span className="bookmark-count" aria-hidden="true">
                {bookmarks.items.length > 99 ? "99+" : bookmarks.items.length}
              </span>
            )}
          </button>
          <button
            type="button"
            className="header-button"
            onClick={() => setAboutOpen(true)}
            aria-label="About HackTok and keyboard shortcuts"
          >
            <Info size={19} />
          </button>
        </div>
      </header>
      <Feed
        muted={muted}
        rotated={rotated}
        suspended={aboutOpen}
        overlayOpen={aboutOpen || bookmarksOpen || commentVideo !== null}
        onMute={toggleMuted}
        onRotate={toggleRotation}
        onComments={setCommentVideo}
        bookmarkIds={bookmarks.ids}
        onBookmark={bookmarks.toggle}
      />
      {aboutOpen && <InfoDialog onClose={closeAbout} />}
      {commentVideo && (
        <CommentsDrawer
          key={commentVideo.id}
          video={commentVideo}
          onClose={closeComments}
        />
      )}
      {bookmarksOpen && (
        <BookmarksDrawer
          items={bookmarks.items}
          storageError={bookmarks.storageError}
          onRemove={bookmarks.remove}
          onClose={closeBookmarks}
        />
      )}
    </div>
  );
}
