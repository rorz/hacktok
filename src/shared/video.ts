export interface Video {
  id: string;
  title: string;
  channel: string;
  summary: string;
  why: string;
  topic: string;
  kind: string;
  recommendations: number;
  commentCount: number;
  score: number;
  discussion: number | null;
  quote: string | null;
  ratio: number | null;
}

export interface FeedPage {
  videos: Video[];
  total: number;
  next: number | null;
}
