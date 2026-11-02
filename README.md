# HackTok

A full-screen feed of the 6,454 videos in [HackerTube](https://hackertube.org).
Swipe, scroll, or use the arrow keys. The interface floats over the video.
Production domain: [hacktock.org](https://hacktock.org). The product name is HackTok.

## Run

```sh
bun install
bun run dev
```

Uses `http://127.0.0.1:5173` and refuses to switch ports. The user manages the
dev server. Bun runs the tooling; Cloudflare's Vite plugin runs the Worker in
workerd during development.

```sh
bun run check       # TypeScript, Biome, Knip, pokayoke
bun run build       # Browser assets and Worker bundle
bun run deploy      # Checks, builds, then deploys to your Cloudflare account
```

No tests or test framework. `bun.lock` pins dependencies. Regenerate Worker
types with `bun run cf:types` when changing bindings.

`wrangler.jsonc` targets `hacktock.org` as a Cloudflare Worker Custom Domain.
The existing Cloudflare zone must be active in the deploying account. Running
`bun run deploy` publishes the Worker and attaches the domain; changing this
configuration locally does not deploy it. The default `workers.dev` address is
disabled. Canonical and Open Graph URLs use `https://hacktock.org/`.

## Controls

| Action                 | Control                             |
| ---------------------- | ----------------------------------- |
| Next / previous        | Swipe, scroll, arrows, or J / K     |
| Play / pause           | Tap video or Space                  |
| Sound                  | Sound button or M                   |
| Bookmark video         | Bookmark button or B                |
| Saved videos           | Bookmarks button beside About       |
| Rotate video 90°       | R                                   |
| Hacker News comments   | Comments button; right-side drawer  |
| Share a specific video | Share; links include `v` and `seed` |
| New shuffle            | Click the HackTok logo              |

Each visit to `/` creates a random seed. Fisher–Yates shuffles the entire catalog
with equal weighting: no recommendation-score or video-shape preference. The
URL updates to `?v=VIDEO_ID&seed=SEED` on every video change. Reloading or sharing
that URL resumes the same video and sequence. Navigation replaces the current
history entry so swiping does not fill the browser's Back stack.

Starts muted to support autoplay; offers a play button when the browser blocks
it. Pauses when hidden or when About opens. Reading comments leaves playback
running and prevents automatic advancement while either drawer is open.

Bookmarks are saved in localStorage on this browser, newest first, and sync
between tabs on the same origin. The drawer lets you reopen a saved video with
its original shuffle seed or remove it. If browser storage is unavailable,
bookmarks remain usable for the current visit and the drawer shows a notice.

When YouTube reports a removed, private, invalid, or embedding-blocked video,
the feed removes it and advances automatically. Those IDs are excluded on this
browser for seven days, including after a reload. Availability is learned from
the player, so a newly blocked video may briefly begin loading before it is
skipped. Temporary player or network errors offer a retry.

## Structure

- `src/` — React UI, native scroll snapping, a bounded window of feed items,
  and one active YouTube player. No router or global state library.
- `worker/` — seeded ordering, 20-video pages, and original HN comment fetching.
- `data/` — attributed catalog snapshot, comment IDs, and public embed dimensions.
- `scripts/` — validated catalog/comment import and resumable format enrichment.
- `.pokayoke/` — TypeScript policies, verification commands, stable dev port,
  and the boundary keeping catalog data out of the browser bundle.

The Worker needs no database, credentials, or upstream call to serve the feed.
Video playback depends on YouTube. Opening comments calls the public
[Hacker News API](https://github.com/HackerNews/API), with bounded concurrency
and five-minute caching. Full comment text is rendered with a small HTML
allowlist; there are no summaries in the drawer. It includes every indexed
comment from HackerTube's export (39,834 links, at most 20 per video), with
author, date, and original permalink. This is not a live search of all HN
mentions or a recursive thread viewer. No accounts, engagement tracking,
video downloads, or hosted video storage.

## Refresh the data

```sh
bun run data:sync
bun run data:comments
bun run data:formats 200  # Inspect up to 200 new or stale public oEmbed entries
```

The importer validates every record before replacing the snapshot. Format
enrichment uses four concurrent requests, stops on rate limiting, and skips
entries checked within 30 days. Failed lookups stay unknown. Rebuild to publish
updated data.

The original export has no aspect ratios or durations. YouTube oEmbed reports
**embed viewport proportions, not source resolution**. In the current snapshot,
6,453 responses were all 16:9 or 4:3; one lookup failed. We cannot establish
native portrait/square source formats from that evidence. These dimensions
only guide framing; they do not change the order. Rotation remains available
for every video.

Duration comes from the active player. Video summaries are HackerTube's
AI-assisted annotations, not manually checked editorial claims.

## License and attribution

HackTok's application code is [MIT licensed](LICENSE), copyright 2026
Rory McMeekin. The imported catalog and comment index retain their separate
ODC-By 1.0 license; see [data provenance](data/README.md). The MIT license does
not relicense third-party data, comments, videos, or dependencies.

Inspired by [Andrej Karpathy's HackerTube post](https://karpathy.bearblog.dev/hacker-tube/).
Data from [HackerTube](https://hackertube.org/data) and
[open-index/hacker-news](https://huggingface.co/datasets/open-index/hacker-news),
under [ODC-By 1.0](https://opendatacommons.org/licenses/by/1-0/).
Comments belong to their authors; videos, titles, and channel names to their
creators. This project is independent of Andrej Karpathy, YouTube, and Hacker News.
