import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Linkifier {
  Id!: long;
  TenantId!: long;
  Pattern!: string;
  UrlTemplate!: string;
  ExampleInput?: string;
  ReverseTemplate?: string;
  AlternativeUrlTemplatesJson?: string;
  Ordering!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<Linkifier>()
  .prop((x) => x.Id)
  .add(KeyAttribute);
A<Linkifier>().add(IndexAttribute, ["TenantId"]);
