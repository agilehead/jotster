import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Attachment {
  Id!: long;
  TenantId!: long;
  UserId!: long;
  FileName!: string;
  PathId!: string;
  Size!: long;
  ContentType!: string;
  IsWebPublic!: int;
  CreatedAt!: long;
}

A<Attachment>()
  .prop((x) => x.Id)
  .add(KeyAttribute);
A<Attachment>().add(IndexAttribute, ["TenantId", "PathId"]);
A<Attachment>().add(IndexAttribute, ["TenantId", "UserId", "CreatedAt"]);
