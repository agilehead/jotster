import { attributes as A } from "@tsonic/core/lang.js";
import { PrimaryKeyAttribute, IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class DmGroupMember {
  DmGroupId!: string;
  UserId!: string;
}

A.on(DmGroupMember).type.add(PrimaryKeyAttribute, "DmGroupId", ["UserId"]);
A.on(DmGroupMember).type.add(IndexAttribute, ["UserId", "DmGroupId"]);
