import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";

export class TenantUserSettingDefault {
  TenantId!: long;
  SettingsJson!: string;
}

A.on(TenantUserSettingDefault).prop((x) => x.TenantId).add(KeyAttribute);
