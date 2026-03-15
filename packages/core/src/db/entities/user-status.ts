import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class UserStatus {
  UserId!: long;
  TenantId!: long;
  StatusText!: string;
  EmojiName?: string;
  EmojiCode?: string;
  ReactionType?: string;
  UpdatedAt!: long;
}

A.on(UserStatus).prop((x) => x.UserId).add(KeyAttribute);
A.on(UserStatus).type.add(IndexAttribute, ["TenantId"]);
