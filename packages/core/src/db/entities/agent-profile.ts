import type { long } from "@tsonic/core/types.js";

export class AgentProfile {
  IdentityId!: string;
  OwnerIdentityId!: string | null;
  AgentKind!: string;
  DisplayName!: string;
  Description!: string;
  AvatarUrl!: string | null;
  CreatedAt!: long;
  UpdatedAt!: long;
}
