import type { long } from "@tsonic/core/types.js";

export class MessageVersion {
  WorkspaceId!: string;
  Id!: string;
  MessageId!: string;
  EditorParticipantId!: string;
  PreviousContent?: string;
  PreviousRenderedContent?: string;
  PreviousThreadId?: string;
  PreviousChannelId?: string;
  CreatedAt!: long;
}
