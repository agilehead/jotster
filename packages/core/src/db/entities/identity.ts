import type { long } from "@tsonic/core/types.js";

export class Identity {
  Id!: string;
  Kind!: string;
  PrimaryEmail?: string;
  DisplayName!: string;
  State!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}
