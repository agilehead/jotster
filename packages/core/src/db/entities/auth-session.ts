import type { long } from "@tsonic/core/types.js";

export class AuthSession {
  WorkspaceId!: string;
  Id!: string;
  ParticipantId!: string;
  SessionHash!: string;
  State!: string;
  CreatedAt!: long;
  ExpiresAt!: long;
  RevokedAt!: long | null;
}
