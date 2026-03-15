import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class UserGroup {
  Id!: string;
  PublicId!: long;
  TenantId!: string;
  Name!: string;
  Description!: string;
  IsSystemGroup!: int;
  CreatorId?: string;
  CanAddMembersGroupId?: string;
  CanJoinGroupId?: string;
  CanLeaveGroupId?: string;
  CanManageGroupId?: string;
  CanMentionGroupId?: string;
  CanRemoveMembersGroupId?: string;
  IsActive!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A.on(UserGroup).prop((x) => x.Id).add(KeyAttribute);
A.on(UserGroup).type.add(IndexAttribute, ["TenantId"]);
A.on(UserGroup).type.add(IndexAttribute, ["TenantId", "Name"]);
