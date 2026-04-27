import type { long } from "@tsonic/core/types.js";

export class Participant {
  WorkspaceId!: string;
  Id!: string;
  WorkspaceMemberId!: string;
  Kind!: string;
  DisplayName!: string;
  AvatarUrl?: string;
  State!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}
