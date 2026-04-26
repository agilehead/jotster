import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Workspace {
  Id!: string;
  Slug!: string;
  Name!: string;
  Description!: string;
  IconUrl?: string;
  LogoUrl?: string;
  State!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<Workspace>()
  .prop((x) => x.Id)
  .add(KeyAttribute);
A<Workspace>().add(IndexAttribute, ["Slug"]);
A<Workspace>().add(IndexAttribute, ["State"]);
