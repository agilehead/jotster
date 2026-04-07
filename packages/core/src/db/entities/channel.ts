import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Channel {
  Id!: long;
  TenantId!: long;
  Name!: string;
  Description!: string;
  RenderedDescription!: string;
  IsPrivate!: int;
  IsWebPublic!: int;
  HistoryPublicToSubscribers!: int;
  CreatorId?: long;
  MessageRetentionDays?: int;
  FirstMessageId?: long;
  IsArchived!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<Channel>()
  .prop((x) => x.Id)
  .add(KeyAttribute);
A<Channel>().add(IndexAttribute, ["TenantId", "Name"]);
A<Channel>().add(IndexAttribute, ["TenantId", "IsArchived"]);
