import { useCallback, useLayoutEffect, useRef, useState } from "react";

export function useViewport(count: number) {
  const scroller = useRef<HTMLElement>(null);
  const [position, setActive] = useState(0);
  const active = Math.min(position, Math.max(0, count - 1));
  const height = useRef(0);
  const resizing = useRef(true);
  const activeRef = useRef(active);
  activeRef.current = active;

  useLayoutEffect(() => {
    if (position === active) return;
    setActive(active);
    scroller.current?.scrollTo({
      top: active * height.current,
      behavior: "instant",
    });
  }, [active, position]);

  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element) return;
    let frame = 0;
    const resize = () => {
      const nextHeight = element.clientHeight;
      if (nextHeight < 1 || nextHeight === height.current) return;
      resizing.current = true;
      window.cancelAnimationFrame(frame);
      element.style.scrollSnapType = "none";
      height.current = nextHeight;
      // Resize every page and spacer before restoring the current video's offset.
      element.style.setProperty("--page-height", `${nextHeight}px`);
      const align = () =>
        element.scrollTo({
          top: activeRef.current * nextHeight,
          behavior: "instant",
        });
      align();
      frame = window.requestAnimationFrame(() => {
        if (element.clientHeight !== nextHeight) {
          resize();
          return;
        }
        element.style.scrollSnapType = "";
        align();
        frame = window.requestAnimationFrame(() => {
          if (element.clientHeight !== nextHeight) resize();
          else resizing.current = false;
        });
      });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      element.style.scrollSnapType = "";
      element.style.removeProperty("--page-height");
      height.current = 0;
    };
  }, []);

  const onScroll = useCallback(() => {
    const element = scroller.current;
    // Resize-generated scroll events can arrive before the ResizeObserver.
    if (!element || resizing.current || element.clientHeight !== height.current)
      return;
    const next = Math.max(
      0,
      Math.min(count - 1, Math.round(element.scrollTop / height.current)),
    );
    activeRef.current = next;
    setActive(next);
  }, [count]);

  const go = useCallback(
    (direction: number) => {
      if (resizing.current) return;
      const next = Math.max(
        0,
        Math.min(count - 1, activeRef.current + direction),
      );
      scroller.current?.scrollTo({
        top: next * height.current,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    },
    [count],
  );

  return { scroller, active, onScroll, go };
}
