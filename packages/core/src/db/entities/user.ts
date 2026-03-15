import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class User {
  Id!: string;
  PublicId!: long;
  TenantId!: string;
  Email!: string;
  FullName!: string;
  PasswordHash?: string;
  Role!: int;
  AvatarUrl?: string;
  AvatarSource!: string;
  IsBot!: int;
  BotType?: int;
  BotOwnerId?: string;
  IsActive!: int;
  Timezone!: string;
  DateJoined!: long;
  IsBillingAdmin!: int;
  DeliveryEmail!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A.on(User).prop((x) => x.Id).add(KeyAttribute);
A.on(User).type.add(IndexAttribute, ["TenantId", "Email"]);
A.on(User).type.add(IndexAttribute, ["TenantId", "IsActive"]);
