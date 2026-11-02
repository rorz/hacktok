import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
  onClose: () => void;
}

export function InfoDialog({ onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="info-dialog"
      onClose={(event) => {
        // Strict Mode can close and reopen the dialog before its close event fires.
        if (!event.currentTarget.open) onClose();
      }}
      aria-labelledby="dialog-title"
    >
      <button
        type="button"
        className="dialog-close"
        aria-label="Close dialog"
        onClick={onClose}
      >
        <X size={20} />
      </button>
      <h2 id="dialog-title">About HackTok</h2>
      <p>
        Videos from{" "}
        <a href="https://hackertube.org" target="_blank" rel="noreferrer">
          HackerTube
        </a>
        , originally shared on Hacker News. Fully{" "}
        <a
          href="https://github.com/rorz/hacktok"
          target="_blank"
          rel="noreferrer"
        >
          open source.
        </a>
      </p>
      <p className="fine-print">
        Data:{" "}
        <a href="https://hackertube.org/data" target="_blank" rel="noreferrer">
          HackerTube
        </a>{" "}
        and{" "}
        <a
          href="https://huggingface.co/datasets/open-index/hacker-news"
          target="_blank"
          rel="noreferrer"
        >
          open-index/hacker-news
        </a>
        , under{" "}
        <a
          href="https://opendatacommons.org/licenses/by/1-0/"
          target="_blank"
          rel="noreferrer"
        >
          ODC-By 1.0
        </a>
        . Comments belong to their authors; videos to their creators.
        Independent of YouTube, Hacker News, and Andrej Karpathy.
      </p>
      <div className="keyboard-guide">
        <span>
          Next / previous{" "}
          <span>
            <kbd>↓</kbd> <kbd>↑</kbd>
          </span>
        </span>
        <span>
          Play / pause <kbd>space</kbd>
        </span>
        <span>
          Sound <kbd>M</kbd>
        </span>
        <span>
          Bookmark video <kbd>B</kbd>
        </span>
        <span>
          Rotate video <kbd>R</kbd>
        </span>
        <span>
          Show / hide UI <kbd>U</kbd>
        </span>
      </div>
      <p className="maker-credit">
        A thing by{" "}
        <a href="https://rorz.io" target="_blank" rel="noreferrer">
          Rory McMeekin
        </a>
      </p>
    </dialog>
  );
}
