import type { long } from "@tsonic/core/types.js";

export class Emoji {
  WorkspaceId!: string;
  Id!: string;
  Key!: string;
  DisplayName!: string;
  ImageStorageKey!: string;
  CreatedByParticipantId?: string;
  CreatedAt!: long;
}
