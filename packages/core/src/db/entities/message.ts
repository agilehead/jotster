import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Message {
  Id!: string;
  TenantId!: string;
  SenderId!: string;
  Type!: string;
  ChannelId?: string;
  Topic?: string;
  DmGroupId?: string;
  Content!: string;
  RenderedContent!: string;
  HasAttachment!: int;
  HasImage!: int;
  HasLink!: int;
  CreatedAt!: long;
  EditedAt?: long;
}

A.on(Message).prop((x) => x.Id).add(KeyAttribute);
A.on(Message).type.add(IndexAttribute, ["TenantId", "ChannelId", "Topic", "Id"]);
A.on(Message).type.add(IndexAttribute, ["TenantId", "DmGroupId", "Id"]);
A.on(Message).type.add(IndexAttribute, ["TenantId", "SenderId", "Id"]);
