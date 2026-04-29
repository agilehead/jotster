import type { long } from "@tsonic/core/types.js";

export class ApiCredential {
  WorkspaceId!: string;
  Id!: string;
  ParticipantId!: string;
  Name!: string;
  CredentialHash!: string;
  ScopesJson!: string;
  CreatedByParticipantId!: string | null;
  CreatedAt!: long;
  ExpiresAt!: long | null;
  RevokedAt!: long | null;
}
