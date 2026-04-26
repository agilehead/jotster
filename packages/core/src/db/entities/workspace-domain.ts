import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class WorkspaceDomain {
  Domain!: string;
  WorkspaceId!: string;
  IsPrimary!: int;
  State!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<WorkspaceDomain>()
  .prop((x) => x.Domain)
  .add(KeyAttribute);
A<WorkspaceDomain>().add(IndexAttribute, ["WorkspaceId","State"]);
A<WorkspaceDomain>().add(IndexAttribute, ["WorkspaceId","IsPrimary"]);
