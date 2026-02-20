import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { AuthenticatedUser, UserGroup } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { getUserGroups } from "../repo/get-user-groups.ts";
import { getUserGroupMembers } from "../repo/get-user-group-members.ts";
import { getUserGroupSubgroups } from "../repo/get-user-group-subgroups.ts";

interface UserGroupWithDetails {
  group: UserGroup;
  members: string[];
  subgroups: string[];
}

export const getUserGroupsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser
): Promise<UserGroupWithDetails[]> => {
  const groups = await getUserGroups(options, user.tenantId);

  const result = new List<UserGroupWithDetails>();
  for (let i = 0; i < groups.Length; i++) {
    const group = groups[i];
    const members = await getUserGroupMembers(options, group.Id);
    const subgroups = await getUserGroupSubgroups(options, group.Id);
    result.Add({ group, members, subgroups });
  }

  return result.ToArray();
};
