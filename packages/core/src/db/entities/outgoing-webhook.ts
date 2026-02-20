import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class OutgoingWebhook {
  Id!: string;
  TenantId!: string;
  BotUserId!: string;
  Url!: string;
  Token!: string;
  TriggerType!: string;
  ChannelIdsJson?: string;
  InterfaceType!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A.on(OutgoingWebhook).prop((x) => x.Id).add(KeyAttribute);
A.on(OutgoingWebhook).type.add(IndexAttribute, ["BotUserId"]);
A.on(OutgoingWebhook).type.add(IndexAttribute, ["TenantId"]);
