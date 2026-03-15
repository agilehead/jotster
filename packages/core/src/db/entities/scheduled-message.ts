import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class ScheduledMessage {
  Id!: long;
  TenantId!: long;
  UserId!: long;
  Type!: string;
  ChannelId?: long;
  Topic?: string;
  RecipientIdsJson?: string;
  Content!: string;
  RenderedContent!: string;
  ScheduledDeliveryTimestamp!: long;
  Failed!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A.on(ScheduledMessage)
  .prop((x) => x.Id)
  .add(KeyAttribute);
A.on(ScheduledMessage).type.add(IndexAttribute, ["TenantId", "UserId"]);
A.on(ScheduledMessage).type.add(IndexAttribute, [
  "TenantId",
  "UserId",
  "ScheduledDeliveryTimestamp",
]);
