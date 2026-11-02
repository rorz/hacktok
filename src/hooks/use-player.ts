import { useCallback, useEffect, useRef, useState } from "react";
import { loadYouTube } from "../lib/youtube";

interface PlayerState {
  ready: boolean;
  playing: boolean;
  blocked: boolean;
  elapsed: number;
  duration: number;
  error: string | null;
}

const initial: PlayerState = {
  ready: false,
  playing: false,
  blocked: false,
  elapsed: 0,
  duration: 0,
  error: null,
};

export function usePlayer(
  id: string,
  muted: boolean,
  suspended: boolean,
  onEnded: () => void,
  onUnavailable: (id: string) => void,
) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YT.Player | null>(null);
  const preferences = useRef({ muted, suspended, onEnded, onUnavailable });
  preferences.current = { muted, suspended, onEnded, onUnavailable };
  const [state, setState] = useState(initial);
  const [attempt, setAttempt] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: The retry generation deliberately recreates the player.
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let disposed = false;
    let instance: YT.Player | null = null;
    let timer: number | undefined;
    setState(initial);
    const readiness = window.setTimeout(() => {
      if (!disposed)
        setState((previous) => ({
          ...previous,
          error: "YouTube is taking a little too long.",
        }));
    }, 20_000);

    void loadYouTube()
      .then((api) => {
        if (disposed) return;
        const mount = document.createElement("div");
        container.replaceChildren(mount);
        instance = new api.Player(mount, {
          videoId: id,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: ({ target }) => {
              if (disposed) return;
              window.clearTimeout(readiness);
              player.current = target;
              target.getIframe().setAttribute("title", "YouTube video player");
              target.getIframe().tabIndex = -1;
              if (preferences.current.muted) target.mute();
              else target.unMute();
              if (!preferences.current.suspended && !document.hidden)
                target.playVideo();
              setState((previous) => ({
                ...previous,
                ready: true,
                error: null,
              }));
              timer = window.setInterval(() => {
                if (disposed) return;
                setState((previous) => ({
                  ...previous,
                  elapsed: target.getCurrentTime(),
                  duration: target.getDuration(),
                }));
              }, 500);
            },
            onStateChange: ({ data, target }) => {
              if (disposed) return;
              if (
                data === api.PlayerState.PLAYING &&
                (preferences.current.suspended || document.hidden)
              ) {
                target.pauseVideo();
                return;
              }
              setState((previous) => ({
                ...previous,
                playing: data === api.PlayerState.PLAYING,
                blocked:
                  data === api.PlayerState.PLAYING ? false : previous.blocked,
              }));
              if (data === api.PlayerState.ENDED) preferences.current.onEnded();
            },
            onAutoplayBlocked: () => {
              if (!disposed)
                setState((previous) => ({
                  ...previous,
                  blocked: true,
                  playing: false,
                }));
            },
            onError: ({ data }) => {
              if (disposed) return;
              window.clearTimeout(readiness);
              if ([2, 100, 101, 150].includes(data)) {
                preferences.current.onUnavailable(id);
                return;
              }
              setState((previous) => ({
                ...previous,
                playing: false,
                error: "This video couldn’t play here. Try again in a moment.",
              }));
            },
          },
        });
      })
      .catch((error: unknown) => {
        if (disposed) return;
        window.clearTimeout(readiness);
        setState((previous) => ({
          ...previous,
          error:
            error instanceof Error ? error.message : "YouTube is unavailable.",
        }));
      });

    return () => {
      disposed = true;
      window.clearTimeout(readiness);
      window.clearInterval(timer);
      player.current = null;
      instance?.destroy();
    };
  }, [id, attempt]);

  useEffect(() => {
    if (!state.ready || !player.current) return;
    if (muted) player.current.mute();
    else player.current.unMute();
  }, [muted, state.ready]);

  useEffect(() => {
    if (suspended && state.ready) player.current?.pauseVideo();
  }, [suspended, state.ready]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) player.current?.pauseVideo();
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () =>
      document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);

  const toggle = useCallback(() => {
    const current = player.current;
    if (!current || preferences.current.suspended) return;
    if (current.getPlayerState() === YT.PlayerState.PLAYING)
      current.pauseVideo();
    else current.playVideo();
  }, []);

  const seek = useCallback(
    (seconds: number) => player.current?.seekTo(seconds, true),
    [],
  );
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { host, ...state, toggle, seek, retry };
}
