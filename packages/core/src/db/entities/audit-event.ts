import type { long } from "@tsonic/core/types.js";

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
