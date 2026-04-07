import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class UserGroup {
  Id!: long;
  TenantId!: long;
  Name!: string;
  Description!: string;
  IsSystemGroup!: int;
  CreatorId?: long;
  CanAddMembersGroupId?: long;
  CanJoinGroupId?: long;
  CanLeaveGroupId?: long;
  CanManageGroupId?: long;
  CanMentionGroupId?: long;
  CanRemoveMembersGroupId?: long;
  IsActive!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<UserGroup>()
  .prop((x) => x.Id)
  .add(KeyAttribute);
A<UserGroup>().add(IndexAttribute, ["TenantId"]);
A<UserGroup>().add(IndexAttribute, ["TenantId", "Name"]);
