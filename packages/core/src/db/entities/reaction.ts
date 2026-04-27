import type { long } from "@tsonic/core/types.js";

export class Reaction {
  WorkspaceId!: string;
  Id!: string;
  MessageId!: string;
  ParticipantId!: string;
  EmojiKey!: string;
  CreatedAt!: long;
}
