import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class DataExport {
  Id!: string;
  PublicId!: long;
  TenantId!: string;
  RequesterId!: string;
  ExportType!: string;
  Status!: string;
  Url?: string;
  ErrorMessage?: string;
  CreatedAt!: long;
  CompletedAt?: long;
  FailedAt?: long;
}

A.on(DataExport).prop((x) => x.Id).add(KeyAttribute);
A.on(DataExport).type.add(IndexAttribute, ["TenantId", "CreatedAt"]);
