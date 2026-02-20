import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";

const PERMISSION_DEFAULTS: Record<string, string> = {
  create_public_stream_policy: "role:members",
  create_private_stream_policy: "role:members",
  create_web_public_stream_policy: "role:owners",
  invite_to_realm_policy: "role:members",
  invite_to_stream_policy: "role:members",
  move_messages_between_streams_policy: "role:members",
  edit_topic_policy: "role:everyone",
  wildcard_mention_policy: "role:members",
  user_group_edit_policy: "role:members",
  can_create_groups: "role:members",
  can_manage_all_groups: "role:administrators",
  can_add_custom_emoji: "role:members",
  can_delete_any_message: "role:administrators",
  can_delete_own_message: "role:everyone",
  can_access_all_users_group: "role:everyone",
  direct_message_permission_group: "role:everyone",
};

export const initializeDefaultPermissionSettings = async (
  options: DbContextOptions,
  tenantId: string
): Promise<Result<Record<string, string>, string>> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const one = 1 as int;

    // Fetch system groups for this tenant
    const systemGroups = await db0.UserGroups
      .Where((g) => g.TenantId === tenantId0).Where((g) => g.IsSystemGroup === one)
      .ToArrayAsync();

    // Build name → id lookup
    const nameToId: Record<string, string> = {};
    for (let i = 0; i < systemGroups.Length; i++) {
      nameToId[systemGroups[i].Name] = systemGroups[i].Id;
    }

    // Map each default setting name to the group ID
    const settings: Record<string, string> = {};
    const settingNames = Object.keys(PERMISSION_DEFAULTS);

    for (let i = 0; i < settingNames.length; i++) {
      const settingName = settingNames[i];
      const groupName = PERMISSION_DEFAULTS[settingName];
      const groupId = nameToId[groupName];

      if (groupId === undefined) {
        return err("System group not found: " + groupName);
      }

      settings[settingName] = groupId;
    }

    return ok(settings);
  } finally {
    db.Dispose();
  }
};
