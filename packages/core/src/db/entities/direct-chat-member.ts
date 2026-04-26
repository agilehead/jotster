import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class DirectChatMember {
  WorkspaceId!: string;
  DirectChatId!: string;
  ParticipantId!: string;
  State!: string;
  CreatedAt!: long;
}

A<DirectChatMember>().add(PrimaryKeyAttribute, "WorkspaceId", ["DirectChatId","ParticipantId"]);
A<DirectChatMember>().add(IndexAttribute, ["WorkspaceId","ParticipantId"]);
