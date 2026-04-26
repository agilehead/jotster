import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class ExternalIdentity {
  WorkspaceId!: string;
  Id!: string;
  IdentityId!: string;
  AuthProviderId!: string;
  Subject!: string;
  EmailAtLogin?: string;
  ClaimsJson!: string;
  LastLoginAt?: long;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<ExternalIdentity>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<ExternalIdentity>().add(IndexAttribute, ["WorkspaceId","AuthProviderId","Subject"]);
A<ExternalIdentity>().add(IndexAttribute, ["IdentityId"]);
A<ExternalIdentity>().add(IndexAttribute, ["WorkspaceId","AuthProviderId"]);
