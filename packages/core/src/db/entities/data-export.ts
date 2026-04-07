import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class DataExport {
  Id!: long;
  TenantId!: long;
  RequesterId!: long;
  ExportType!: string;
  Status!: string;
  Url?: string;
  ErrorMessage?: string;
  CreatedAt!: long;
  CompletedAt?: long;
  FailedAt?: long;
}

A<DataExport>()
  .prop((x) => x.Id)
  .add(KeyAttribute);
A<DataExport>().add(IndexAttribute, ["TenantId", "CreatedAt"]);
