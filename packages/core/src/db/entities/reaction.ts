import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Reaction {
  Id!: string;
  TenantId!: long;
  MessageId!: long;
  UserId!: long;
  EmojiName!: string;
  EmojiCode!: string;
  ReactionType!: string;
  CreatedAt!: long;
}

A<Reaction>()
  .prop((x) => x.Id)
  .add(KeyAttribute);
A<Reaction>().add(IndexAttribute, [
  "MessageId",
  "UserId",
  "EmojiCode",
  "ReactionType",
]);
A<Reaction>().add(IndexAttribute, ["TenantId", "MessageId"]);
A<Reaction>().add(IndexAttribute, ["TenantId", "UserId", "CreatedAt"]);
