import type { long } from "@tsonic/core/types.js";

export class DirectChat {
  WorkspaceId!: string;
  Id!: string;
  Kind!: string;
  State!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}
