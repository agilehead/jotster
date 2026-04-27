import type { long } from "@tsonic/core/types.js";

export class AgentProfile {
  IdentityId!: string;
  OwnerIdentityId?: string;
  AgentKind!: string;
  DisplayName!: string;
  Description!: string;
  AvatarUrl?: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}
