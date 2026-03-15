import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class CustomEmoji {
  Id!: long;
  TenantId!: long;
  Name!: string;
  FileName!: string;
  AuthorId!: long;
  IsActive!: int;
  CreatedAt!: long;
}

A.on(CustomEmoji)
  .prop((x) => x.Id)
  .add(KeyAttribute);
A.on(CustomEmoji).type.add(IndexAttribute, ["TenantId", "IsActive"]);
