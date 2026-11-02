export interface HnComment {
  id: number;
  author: string | null;
  time: number | null;
  html: string;
  status: "available" | "deleted" | "unavailable";
}

export interface CommentsPage {
  comments: HnComment[];
  total: number;
  failed: number;
}
