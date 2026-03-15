import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Subscription {
  Id!: string;
  TenantId!: long;
  UserId!: long;
  ChannelId!: long;
  Color!: string;
  PinToTop!: int;
  IsMuted!: int;
  DesktopNotifications?: int;
  PushNotifications?: int;
  AudibleNotifications?: int;
  EmailNotifications?: int;
  WildcardMentionsNotify?: int;
  CreatedAt!: long;
}

A.on(Subscription).prop((x) => x.Id).add(KeyAttribute);
A.on(Subscription).type.add(IndexAttribute, ["TenantId", "UserId", "ChannelId"]);
A.on(Subscription).type.add(IndexAttribute, ["TenantId", "ChannelId"]);
A.on(Subscription).type.add(IndexAttribute, ["TenantId", "UserId"]);
