import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

interface Props {
  id: string;
  title: string;
  count: number;
  meta?: string;
  onClose: () => void;
  children: ReactNode;
}

export function SideDrawer({
  id,
  title,
  count,
  meta,
  onClose,
  children,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return (
    <dialog
      id={id}
      ref={dialog}
      className="side-drawer"
      aria-labelledby={`${id}-title`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right)
          onClose();
      }}
    >
      <header className="drawer-header">
        <h2 id={`${id}-title`}>
          {title} <span>{count}</span>
        </h2>
        {meta && <span className="drawer-meta">{meta}</span>}
        <button
          type="button"
          className="drawer-close"
          onClick={onClose}
          aria-label={`Close ${title.toLowerCase()}`}
        >
          <X size={22} />
        </button>
      </header>
      <div className="drawer-scroll">{children}</div>
    </dialog>
  );
}
