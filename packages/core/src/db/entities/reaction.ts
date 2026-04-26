import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Reaction {
  WorkspaceId!: string;
  Id!: string;
  MessageId!: string;
  ParticipantId!: string;
  EmojiKey!: string;
  CreatedAt!: long;
}

A<Reaction>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<Reaction>().add(IndexAttribute, ["WorkspaceId","MessageId","ParticipantId","EmojiKey"]);
A<Reaction>().add(IndexAttribute, ["WorkspaceId","ParticipantId","CreatedAt"]);
