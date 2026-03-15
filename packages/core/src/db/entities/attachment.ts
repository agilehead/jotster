import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Attachment {
  Id!: string;
  PublicId!: long;
  TenantId!: string;
  UserId!: string;
  FileName!: string;
  PathId!: string;
  Size!: long;
  ContentType!: string;
  IsWebPublic!: int;
  CreatedAt!: long;
}

A.on(Attachment).prop((x) => x.Id).add(KeyAttribute);
A.on(Attachment).type.add(IndexAttribute, ["TenantId", "PathId"]);
A.on(Attachment).type.add(IndexAttribute, ["TenantId", "UserId", "CreatedAt"]);
