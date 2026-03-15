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

A.on(Channel)
  .prop((x) => x.Id)
  .add(KeyAttribute);
A.on(Channel).type.add(IndexAttribute, ["TenantId", "Name"]);
A.on(Channel).type.add(IndexAttribute, ["TenantId", "IsArchived"]);
