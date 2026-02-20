import { attributes as A } from "@tsonic/core/lang.js";
import { PrimaryKeyAttribute, IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class UserGroupSubgroup {
  ParentGroupId!: string;
  SubgroupId!: string;
}

A.on(UserGroupSubgroup).type.add(PrimaryKeyAttribute, "ParentGroupId", ["SubgroupId"]);
A.on(UserGroupSubgroup).type.add(IndexAttribute, ["SubgroupId"]);
