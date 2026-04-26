import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class MessageMarker {
  WorkspaceId!: string;
  MessageId!: string;
  ParticipantId!: string;
  Marker!: string;
  CreatedAt!: long;
}

A<MessageMarker>().add(PrimaryKeyAttribute, "WorkspaceId", ["MessageId","ParticipantId","Marker"]);
A<MessageMarker>().add(IndexAttribute, ["WorkspaceId","ParticipantId","Marker"]);
