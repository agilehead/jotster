import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Participant {
  WorkspaceId!: string;
  Id!: string;
  WorkspaceMemberId!: string;
  Kind!: string;
  DisplayName!: string;
  AvatarUrl?: string;
  State!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<Participant>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<Participant>().add(IndexAttribute, ["WorkspaceId","WorkspaceMemberId"]);
A<Participant>().add(IndexAttribute, ["WorkspaceId","Kind","State"]);
