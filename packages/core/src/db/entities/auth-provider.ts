import type { int, long } from "@tsonic/core/types.js";

export class AuthProvider {
  WorkspaceId!: string;
  Id!: string;
  Kind!: string;
  DisplayName!: string;
  Issuer!: string;
  ClientId!: string;
  ConfigJson!: string;
  Enabled!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}
