import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Message {
  WorkspaceId!: string;
  Id!: string;
  SenderParticipantId!: string;
  ContainerKind!: string;
  ChannelId?: string;
  ThreadId?: string;
  DirectChatId?: string;
  Content!: string;
  RenderedContent?: string;
  State!: string;
  CreatedAt!: long;
  EditedAt?: long;
}

A<Message>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<Message>().add(IndexAttribute, ["WorkspaceId","ThreadId","CreatedAt"]);
A<Message>().add(IndexAttribute, ["WorkspaceId","DirectChatId","CreatedAt"]);
A<Message>().add(IndexAttribute, ["WorkspaceId","SenderParticipantId","CreatedAt"]);
