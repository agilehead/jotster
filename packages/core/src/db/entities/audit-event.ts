import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class AuditEvent {
  WorkspaceId!: string;
  Id!: string;
  ActorParticipantId?: string;
  Action!: string;
  ObjectType!: string;
  ObjectId?: string;
  MetadataJson!: string;
  CreatedAt!: long;
}

A<AuditEvent>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<AuditEvent>().add(IndexAttribute, ["WorkspaceId","ActorParticipantId","CreatedAt"]);
A<AuditEvent>().add(IndexAttribute, ["WorkspaceId","ObjectType","ObjectId"]);
