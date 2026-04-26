import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Emoji {
  WorkspaceId!: string;
  Id!: string;
  Key!: string;
  DisplayName!: string;
  ImageStorageKey!: string;
  CreatedByParticipantId?: string;
  CreatedAt!: long;
}

A<Emoji>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<Emoji>().add(IndexAttribute, ["WorkspaceId","Key"]);
A<Emoji>().add(IndexAttribute, ["WorkspaceId","CreatedByParticipantId"]);
