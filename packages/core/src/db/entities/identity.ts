import type { long } from "@tsonic/core/types.js";

export class Identity {
  Id!: string;
  Kind!: string;
  PrimaryEmail!: string | null;
  DisplayName!: string;
  State!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}
