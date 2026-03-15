import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Invitation {
  Id!: long;
  TenantId!: long;
  InviterId!: long;
  Email?: string;
  IsMultiuse!: int;
  LinkToken!: string;
  ChannelIdsJson!: string;
  InvitedAsRole!: int;
  Status!: string;
  CreatedAt!: long;
  ExpiresAt?: long;
}

A.on(Invitation)
  .prop((x) => x.Id)
  .add(KeyAttribute);
A.on(Invitation).type.add(IndexAttribute, ["LinkToken"]);
A.on(Invitation).type.add(IndexAttribute, ["TenantId", "Status"]);
A.on(Invitation).type.add(IndexAttribute, ["TenantId", "InviterId"]);
