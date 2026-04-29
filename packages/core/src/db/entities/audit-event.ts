import type { long } from "@tsonic/core/types.js";

export class AuditEvent {
  WorkspaceId!: string;
  Id!: string;
  ActorParticipantId!: string | null;
  Action!: string;
  ObjectType!: string;
  ObjectId!: string | null;
  MetadataJson!: string;
  CreatedAt!: long;
}
