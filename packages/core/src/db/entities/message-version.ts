import type { long } from "@tsonic/core/types.js";

export class MessageVersion {
  WorkspaceId!: string;
  Id!: string;
  MessageId!: string;
  EditorParticipantId!: string;
  PreviousContent!: string | null;
  PreviousRenderedContent!: string | null;
  PreviousThreadId!: string | null;
  PreviousChannelId!: string | null;
  CreatedAt!: long;
}
