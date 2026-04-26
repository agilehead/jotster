import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Attachment {
  WorkspaceId!: string;
  Id!: string;
  OwnerParticipantId!: string;
  MessageId?: string;
  StorageKey!: string;
  FileName!: string;
  ContentType!: string;
  ByteSize!: long;
  CreatedAt!: long;
}

A<Attachment>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<Attachment>().add(IndexAttribute, ["WorkspaceId","StorageKey"]);
A<Attachment>().add(IndexAttribute, ["WorkspaceId","OwnerParticipantId","CreatedAt"]);
