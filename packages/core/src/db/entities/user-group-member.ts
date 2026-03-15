import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import {
  PrimaryKeyAttribute,
  IndexAttribute,
} from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class UserGroupMember {
  UserGroupId!: long;
  UserId!: long;
}

A.on(UserGroupMember).type.add(PrimaryKeyAttribute, "UserGroupId", ["UserId"]);
A.on(UserGroupMember).type.add(IndexAttribute, ["UserId"]);
