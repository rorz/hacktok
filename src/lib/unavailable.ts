const storageKey = "hacktok:unavailable:v1";
const lifetime = 7 * 24 * 60 * 60 * 1000;

export function createUnavailableStore() {
  const entries = new Map<string, number>();
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      for (const [id, timestamp] of Object.entries(saved)) {
        if (
          /^[\w-]{11}$/.test(id) &&
          typeof timestamp === "number" &&
          timestamp > Date.now() - lifetime
        ) {
          entries.set(id, timestamp);
        }
      }
    }
  } catch (error) {
    console.warn(
      "Could not read unavailable videos; this visit will still skip them.",
      error,
    );
  }
  return {
    has: (id: string) => entries.has(id),
    count: () => entries.size,
    remember(id: string) {
      entries.set(id, Date.now());
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify(Object.fromEntries(entries)),
        );
      } catch (error) {
        console.warn(
          "Could not save unavailable videos; they remain skipped for this visit.",
          error,
        );
      }
    },
  };
}
