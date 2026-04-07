import type { long } from "@tsonic/core/types.js";

export interface TopicSummary {
  name: string;
  maxId: long;
}

export interface TopicMapEntry {
  maxId: long;
  createdAt: number;
}
