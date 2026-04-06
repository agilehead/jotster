import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class User {
  Id!: long;
  TenantId!: long;
  Email!: string;
  FullName!: string;
  PasswordHash?: string;
  Role!: int;
  AvatarUrl?: string;
  AvatarSource!: string;
  IsBot!: int;
  BotType?: int;
  BotOwnerId?: long;
  IsActive!: int;
  Timezone!: string;
  DateJoined!: long;
  IsBillingAdmin!: int;
  DeliveryEmail!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<User>()
  .prop((x) => x.Id)
  .add(KeyAttribute);
A<User>().add(IndexAttribute, ["TenantId", "Email"]);
A<User>().add(IndexAttribute, ["TenantId", "IsActive"]);
