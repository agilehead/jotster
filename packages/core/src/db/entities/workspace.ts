import type { long } from "@tsonic/core/types.js";

export class Workspace {
  Id!: string;
  Slug!: string;
  Name!: string;
  Description!: string;
  IconUrl?: string;
  LogoUrl?: string;
  State!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}
