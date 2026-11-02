import { Bookmark, BookmarkMinus, Play } from "lucide-react";
import type { BookmarkEntry } from "../hooks/use-bookmarks";
import { SideDrawer } from "./SideDrawer";

interface Props {
  items: readonly BookmarkEntry[];
  storageError: boolean;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function BookmarksDrawer({
  items,
  storageError,
  onRemove,
  onClose,
}: Props) {
  return (
    <SideDrawer
      id="bookmarks-drawer"
      title="Bookmarks"
      count={items.length}
      onClose={onClose}
    >
      {storageError && (
        <p className="bookmarks-notice" role="status">
          Browser storage is unavailable. Changes are saved for this visit only.
        </p>
      )}
      {items.length === 0 ? (
        <div className="bookmarks-empty">
          <Bookmark size={28} strokeWidth={1.5} />
          <p>No bookmarks yet.</p>
          <span>Save a video using the bookmark button.</span>
        </div>
      ) : (
        <ul className="bookmarks-list">
          {items.map((item) => (
            <li key={item.id} className="bookmark-item">
              <a
                className="bookmark-link"
                href={`/?${new URLSearchParams({ v: item.id, seed: item.seed })}`}
                aria-label={`Play ${item.title}`}
              >
                <span className="bookmark-thumbnail">
                  <img
                    src={`https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`}
                    alt=""
                    loading="lazy"
                  />
                  <Play size={18} fill="currentColor" aria-hidden="true" />
                </span>
                <span className="bookmark-details">
                  <span className="bookmark-title">{item.title}</span>
                  <span className="bookmark-channel">{item.channel}</span>
                </span>
              </a>
              <button
                type="button"
                className="bookmark-remove"
                onClick={() => onRemove(item.id)}
                aria-label={`Remove ${item.title} from bookmarks`}
                title="Remove bookmark"
              >
                <BookmarkMinus size={17} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </SideDrawer>
  );
}
