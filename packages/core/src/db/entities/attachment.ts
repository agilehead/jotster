import type { long } from "@tsonic/core/types.js";

export class Attachment {
  WorkspaceId!: string;
  Id!: string;
  OwnerParticipantId!: string;
  MessageId!: string | null;
  StorageKey!: string;
  FileName!: string;
  ContentType!: string;
  ByteSize!: long;
  CreatedAt!: long;
}
