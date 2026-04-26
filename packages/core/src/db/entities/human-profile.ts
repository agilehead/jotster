import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";

export class HumanProfile {
  IdentityId!: string;
  FullName!: string;
  AvatarUrl?: string;
  Timezone!: string;
  Locale!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<HumanProfile>()
  .prop((x) => x.IdentityId)
  .add(KeyAttribute);
