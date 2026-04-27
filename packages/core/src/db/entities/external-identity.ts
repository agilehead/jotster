import type { long } from "@tsonic/core/types.js";

export class ExternalIdentity {
  WorkspaceId!: string;
  Id!: string;
  IdentityId!: string;
  AuthProviderId!: string;
  Subject!: string;
  EmailAtLogin?: string;
  ClaimsJson!: string;
  LastLoginAt?: long;
  CreatedAt!: long;
  UpdatedAt!: long;
}
