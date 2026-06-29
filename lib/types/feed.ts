export interface FeedEvent {
  t: number;
  feed: string;
  value: number | string;
}

export interface ReplayFile {
  name: string;
  description: string;
  feedKey: string;
  events: FeedEvent[];
}

export interface FeedState {
  [key: string]: number | string;
}
