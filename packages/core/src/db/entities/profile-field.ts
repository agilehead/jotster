import type { int, long } from "@tsonic/core/types.js";

export class ProfileField {
  WorkspaceId!: string;
  Id!: string;
  Key!: string;
  Label!: string;
  ValueKind!: string;
  Required!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}
