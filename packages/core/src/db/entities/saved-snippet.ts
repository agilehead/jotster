import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class SavedSnippet {
  Id!: long;
  TenantId!: long;
  UserId!: long;
  Title!: string;
  Content!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<SavedSnippet>()
  .prop((x) => x.Id)
  .add(KeyAttribute);
A<SavedSnippet>().add(IndexAttribute, ["TenantId", "UserId"]);
