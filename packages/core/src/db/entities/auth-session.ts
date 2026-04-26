import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class AuthSession {
  WorkspaceId!: string;
  Id!: string;
  ParticipantId!: string;
  SessionHash!: string;
  State!: string;
  CreatedAt!: long;
  ExpiresAt!: long;
  RevokedAt?: long;
}

A<AuthSession>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<AuthSession>().add(IndexAttribute, ["WorkspaceId","SessionHash"]);
A<AuthSession>().add(IndexAttribute, ["WorkspaceId","ParticipantId","State"]);
