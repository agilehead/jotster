import type { long } from "@tsonic/core/types.js";

export class GroupChild {
  WorkspaceId!: string;
  ParentGroupId!: string;
  ChildGroupId!: string;
  CreatedAt!: long;
}
