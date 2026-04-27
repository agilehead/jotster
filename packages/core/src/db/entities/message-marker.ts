import type { long } from "@tsonic/core/types.js";

export class MessageMarker {
  WorkspaceId!: string;
  MessageId!: string;
  ParticipantId!: string;
  Marker!: string;
  CreatedAt!: long;
}
