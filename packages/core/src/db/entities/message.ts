import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Message {
  Id!: long;
  TenantId!: long;
  SenderId!: long;
  Type!: string;
  ChannelId?: long;
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

A<Message>()
  .prop((x) => x.Id)
  .add(KeyAttribute);
A<Message>().add(IndexAttribute, [
  "TenantId",
  "ChannelId",
  "Topic",
  "Id",
]);
A<Message>().add(IndexAttribute, ["TenantId", "DmGroupId", "Id"]);
A<Message>().add(IndexAttribute, ["TenantId", "SenderId", "Id"]);
