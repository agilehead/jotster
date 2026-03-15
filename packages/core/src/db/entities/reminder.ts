import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Reminder {
  Id!: long;
  TenantId!: long;
  UserId!: long;
  MessageId!: long;
  Note?: string;
  Content!: string;
  RenderedContent!: string;
  ScheduledDeliveryTimestamp!: long;
  Failed!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A.on(Reminder)
  .prop((x) => x.Id)
  .add(KeyAttribute);
A.on(Reminder).type.add(IndexAttribute, ["TenantId", "UserId"]);
A.on(Reminder).type.add(IndexAttribute, [
  "TenantId",
  "UserId",
  "ScheduledDeliveryTimestamp",
]);
