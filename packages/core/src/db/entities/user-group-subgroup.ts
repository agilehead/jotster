import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import {
  PrimaryKeyAttribute,
  IndexAttribute,
} from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class UserGroupSubgroup {
  ParentGroupId!: long;
  SubgroupId!: long;
}

A<UserGroupSubgroup>().add(PrimaryKeyAttribute, "ParentGroupId", [
  "SubgroupId",
]);
A<UserGroupSubgroup>().add(IndexAttribute, ["SubgroupId"]);
