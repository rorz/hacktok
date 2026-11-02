declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

let loading: Promise<typeof YT> | null = null;

export function loadYouTube(): Promise<typeof YT> {
  if (typeof YT !== "undefined" && YT.Player) return Promise.resolve(YT);
  if (loading) return loading;
  loading = new Promise<typeof YT>((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      script.remove();
      reject(new Error("YouTube took too long to respond."));
    }, 15_000);
    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      resolve(YT);
    };
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => {
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error("Could not connect to YouTube."));
    };
    document.head.append(script);
  }).catch((error: unknown) => {
    loading = null;
    throw error;
  });
  return loading;
}

export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = String(total % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${remainder}`
    : `${minutes}:${remainder}`;
}
