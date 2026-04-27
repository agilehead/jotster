import type { long } from "@tsonic/core/types.js";

export class HumanProfile {
  IdentityId!: string;
  FullName!: string;
  AvatarUrl?: string;
  Timezone!: string;
  Locale!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}
