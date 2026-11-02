import { useCallback, useEffect, useState } from "react";
import type { CommentsPage } from "../shared/comments";

type State = {
  page: CommentsPage | null;
  loading: boolean;
  error: string | null;
};

export function useComments(videoId: string) {
  const [state, setState] = useState<State>({
    page: null,
    loading: true,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({ ...previous, loading: true, error: null }));
    const load = async () => {
      try {
        const response = await fetch(`/api/comments/${videoId}`, {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(20_000),
          ]),
          cache: attempt > 0 ? "reload" : "default",
        });
        if (!response.ok) throw new Error("Couldn’t load the comments.");
        const page: CommentsPage = await response.json();
        if (!controller.signal.aborted)
          setState({ page, loading: false, error: null });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState((previous) => ({
          ...previous,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Couldn’t load the comments.",
        }));
      }
    };
    void load();
    return () => controller.abort();
  }, [videoId, attempt]);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { ...state, retry };
}
