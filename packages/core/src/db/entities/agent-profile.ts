import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

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

A<AgentProfile>()
  .prop((x) => x.IdentityId)
  .add(KeyAttribute);
A<AgentProfile>().add(IndexAttribute, ["OwnerIdentityId"]);
