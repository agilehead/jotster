import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import {
  PrimaryKeyAttribute,
  IndexAttribute,
} from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class DmGroupMember {
  DmGroupId!: string;
  UserId!: long;
}

A<DmGroupMember>().add(PrimaryKeyAttribute, "DmGroupId", ["UserId"]);
A<DmGroupMember>().add(IndexAttribute, ["UserId", "DmGroupId"]);
