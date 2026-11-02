import { useCallback, useEffect, useRef, useState } from "react";
import { loadYouTube } from "../lib/youtube";

interface PlayerState {
  videoId: string | null;
  ready: boolean;
  playing: boolean;
  started: boolean;
  buffering: boolean;
  blocked: boolean;
  elapsed: number;
  duration: number;
  error: string | null;
}

const initial: PlayerState = {
  videoId: null,
  ready: false,
  playing: false,
  started: false,
  buffering: false,
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
  const preferences = useRef({ id, muted, suspended, onEnded, onUnavailable });
  preferences.current = { id, muted, suspended, onEnded, onUnavailable };
  const loadedId = useRef<string | null>(null);
  const playingId = useRef<string | null>(null);
  const [state, setState] = useState(initial);
  const [attempt, setAttempt] = useState(0);

  const loadVideo = useCallback((target: YT.Player) => {
    const current = preferences.current;
    loadedId.current = current.id;
    playingId.current = null;
    setState({
      ...initial,
      videoId: current.id,
      ready: true,
      buffering: true,
    });
    // Reuse the iframe and its media element so the first play gesture carries on.
    if (current.suspended || document.hidden) target.cueVideoById(current.id);
    else target.loadVideoById(current.id);
  }, []);

  const isCurrentVideo = useCallback((target: YT.Player) => {
    const videoId = new URLSearchParams(target.getVideoUrl().split("?")[1]).get(
      "v",
    );
    return (
      loadedId.current === preferences.current.id &&
      (!videoId || videoId === preferences.current.id)
    );
  }, []);

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
          videoId: preferences.current.id,
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
              loadVideo(target);
              timer = window.setInterval(() => {
                if (disposed || !isCurrentVideo(target)) return;
                setState((previous) => ({
                  ...previous,
                  elapsed: target.getCurrentTime(),
                  duration: target.getDuration(),
                }));
              }, 500);
            },
            onStateChange: ({ data, target }) => {
              if (disposed || !isCurrentVideo(target)) return;
              if (
                data === api.PlayerState.PLAYING &&
                (preferences.current.suspended || document.hidden)
              ) {
                target.pauseVideo();
                return;
              }
              if (data === api.PlayerState.PLAYING)
                playingId.current = loadedId.current;
              setState((previous) => ({
                ...previous,
                playing: data === api.PlayerState.PLAYING,
                started: previous.started || data === api.PlayerState.PLAYING,
                buffering: data === api.PlayerState.BUFFERING,
                blocked:
                  data === api.PlayerState.PLAYING ? false : previous.blocked,
              }));
              if (
                data === api.PlayerState.ENDED &&
                playingId.current === preferences.current.id
              ) {
                playingId.current = null;
                preferences.current.onEnded();
              }
            },
            onAutoplayBlocked: ({ target }) => {
              if (!disposed && isCurrentVideo(target))
                setState((previous) => ({
                  ...previous,
                  blocked: true,
                  playing: false,
                  buffering: false,
                }));
            },
            onError: ({ data, target }) => {
              if (disposed || !isCurrentVideo(target)) return;
              window.clearTimeout(readiness);
              if ([2, 100, 101, 150].includes(data)) {
                preferences.current.onUnavailable(preferences.current.id);
                return;
              }
              setState((previous) => ({
                ...previous,
                playing: false,
                buffering: false,
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
      loadedId.current = null;
      playingId.current = null;
      instance?.destroy();
    };
  }, [attempt, loadVideo, isCurrentVideo]);

  useEffect(() => {
    if (player.current && loadedId.current !== id) loadVideo(player.current);
  }, [id, loadVideo]);

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
    if (
      current.getPlayerState() === YT.PlayerState.PLAYING ||
      current.getPlayerState() === YT.PlayerState.BUFFERING
    )
      current.pauseVideo();
    else current.playVideo();
  }, []);

  const seek = useCallback(
    (seconds: number) => player.current?.seekTo(seconds, true),
    [],
  );
  const retry = useCallback(() => {
    if (player.current) loadVideo(player.current);
    else setAttempt((value) => value + 1);
  }, [loadVideo]);
  // Cover the previous frame in the same render that selects the next video.
  const currentState =
    state.videoId === id ? state : { ...initial, ready: state.ready };
  const loading =
    !currentState.error &&
    !currentState.blocked &&
    (currentState.buffering || !currentState.started);
  return { host, ...currentState, loading, toggle, seek, retry };
}
