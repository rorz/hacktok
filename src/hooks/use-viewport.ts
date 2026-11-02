import { useCallback, useEffect, useRef, useState } from "react";

export function useViewport(count: number) {
  const scroller = useRef<HTMLElement>(null);
  const [position, setActive] = useState(0);
  const active = Math.min(position, Math.max(0, count - 1));
  const [height, setHeight] = useState(1);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (position === active) return;
    setActive(active);
    scroller.current?.scrollTo({ top: active * height, behavior: "instant" });
  }, [active, position, height]);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      const nextHeight = element.clientHeight;
      if (nextHeight < 1) return;
      setHeight(nextHeight);
      element.scrollTo({
        top: activeRef.current * nextHeight,
        behavior: "instant",
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const onScroll = useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    setActive(
      Math.max(
        0,
        Math.min(
          count - 1,
          Math.round(element.scrollTop / element.clientHeight),
        ),
      ),
    );
  }, [count]);

  const go = useCallback(
    (direction: number) => {
      const next = Math.max(
        0,
        Math.min(count - 1, activeRef.current + direction),
      );
      scroller.current?.scrollTo({
        top: next * height,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    },
    [count, height],
  );

  return { scroller, active, height, onScroll, go };
}
