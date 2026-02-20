import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Reaction {
  Id!: string;
  TenantId!: string;
  MessageId!: string;
  UserId!: string;
  EmojiName!: string;
  EmojiCode!: string;
  ReactionType!: string;
  CreatedAt!: long;
}

A.on(Reaction).prop((x) => x.Id).add(KeyAttribute);
A.on(Reaction).type.add(IndexAttribute, ["MessageId", "UserId", "EmojiCode", "ReactionType"]);
A.on(Reaction).type.add(IndexAttribute, ["TenantId", "MessageId"]);
A.on(Reaction).type.add(IndexAttribute, ["TenantId", "UserId", "CreatedAt"]);
