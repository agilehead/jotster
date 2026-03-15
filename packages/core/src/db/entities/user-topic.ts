import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class UserTopic {
  Id!: string;
  TenantId!: long;
  UserId!: long;
  ChannelId!: long;
  Topic!: string;
  VisibilityPolicy!: int;
  UpdatedAt!: long;
}

A.on(UserTopic).prop((x) => x.Id).add(KeyAttribute);
A.on(UserTopic).type.add(IndexAttribute, ["TenantId", "UserId", "ChannelId", "Topic"]);
A.on(UserTopic).type.add(IndexAttribute, ["TenantId", "UserId"]);
A.on(UserTopic).type.add(IndexAttribute, ["TenantId", "ChannelId", "Topic"]);
