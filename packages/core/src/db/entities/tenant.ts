import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Tenant {
  Id!: long;
  Subdomain!: string;
  Name!: string;
  Description!: string;
  IconUrl?: string;
  LogoUrl?: string;
  SettingsJson!: string;
  OwnerFullContentAccess!: int;
  Active!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A.on(Tenant).prop((x) => x.Id).add(KeyAttribute);
A.on(Tenant).type.add(IndexAttribute, ["Subdomain"]);
