import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class OutgoingWebhook {
  Id!: string;
  TenantId!: long;
  BotUserId!: long;
  Url!: string;
  Token!: string;
  TriggerType!: string;
  ChannelIdsJson?: string;
  InterfaceType!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<OutgoingWebhook>()
  .prop((x) => x.Id)
  .add(KeyAttribute);
A<OutgoingWebhook>().add(IndexAttribute, ["BotUserId"]);
A<OutgoingWebhook>().add(IndexAttribute, ["TenantId"]);
