# Data provenance

`catalog.json` is a reduced projection of all 6,454 records in HackerTube's
2026-10-31 export: <https://hackertube.org/download/videos.jsonl>.
The source schema and methodology are at <https://hackertube.org/download/DATA.md>.

Credit HackerTube (<https://hackertube.org>) and the open-index/hacker-news
dataset (<https://huggingface.co/datasets/open-index/hacker-news>).
Database license: Open Data Commons Attribution License v1.0,
<https://opendatacommons.org/licenses/by/1-0/>.

Video titles and channel names belong to their creators. HN comments belong
to their authors. Summaries, categories, and recommendation labels were generated
by HackerTube's AI-assisted pipeline and may contain mistakes.

`formats.json` records YouTube's public oEmbed width/height ratio and the
retrieval timestamp. It describes the suggested embed viewport, not verified
source video dimensions. It contains no media files, account data, or API keys.
Refresh with `bun run data:formats` from the project root.

`comment-ids.json` indexes every linked comment in
<https://hackertube.org/download/mentions.jsonl>: 39,834 distinct video/comment
pairs, covering all 6,454 videos. The source export caps each video at 20
comments. This index stores IDs only; the Worker fetches complete original
text from the public Hacker News API when the drawer opens. Removed comments
retain a placeholder and original link. Refresh with `bun run data:comments`
after refreshing the catalog.
