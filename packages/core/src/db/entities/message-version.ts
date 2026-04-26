import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class MessageVersion {
  WorkspaceId!: string;
  Id!: string;
  MessageId!: string;
  EditorParticipantId!: string;
  PreviousContent?: string;
  PreviousRenderedContent?: string;
  PreviousThreadId?: string;
  PreviousChannelId?: string;
  CreatedAt!: long;
}

A<MessageVersion>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<MessageVersion>().add(IndexAttribute, ["WorkspaceId","MessageId","CreatedAt"]);
