import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class SavedSnippet {
  Id!: string;
  TenantId!: string;
  UserId!: string;
  Title!: string;
  Content!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A.on(SavedSnippet).prop((x) => x.Id).add(KeyAttribute);
A.on(SavedSnippet).type.add(IndexAttribute, ["TenantId", "UserId"]);
