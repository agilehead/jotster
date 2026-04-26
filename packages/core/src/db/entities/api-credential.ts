import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class ApiCredential {
  WorkspaceId!: string;
  Id!: string;
  ParticipantId!: string;
  Name!: string;
  CredentialHash!: string;
  ScopesJson!: string;
  CreatedByParticipantId?: string;
  CreatedAt!: long;
  ExpiresAt?: long;
  RevokedAt?: long;
}

A<ApiCredential>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<ApiCredential>().add(IndexAttribute, ["WorkspaceId","CredentialHash"]);
A<ApiCredential>().add(IndexAttribute, ["WorkspaceId","ParticipantId"]);
A<ApiCredential>().add(IndexAttribute, ["WorkspaceId","CreatedByParticipantId"]);
