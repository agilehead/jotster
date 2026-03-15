import type { int, long } from "@tsonic/core/types.js";
import { JsonSerializer } from "@tsonic/dotnet/System.Text.Json.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, parseId } from "@jotster/core/Jotster.Core.js";
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

export const getPermissionSetting = async (
  options: DbContextOptions,
  tenantId: long,
  settingName: string,
): Promise<Result<long, string>> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;

    const tenant = await db0.Tenants.Where(
      (t) => t.Id === tenantId0,
    ).FirstOrDefaultAsync();

    if (tenant === undefined) {
      return err("Tenant not found");
    }

    const settingsOrNull = JsonSerializer.Deserialize<Record<string, string>>(
      tenant.SettingsJson,
    );
    if (settingsOrNull === undefined) {
      const defaultGroupName = PERMISSION_DEFAULTS[settingName];
      if (defaultGroupName === undefined) {
        return err("Unknown permission setting: " + settingName);
      }
      const tenantId2 = tenantId;
      const one2 = 1 as int;
      const sg2 = await db0.UserGroups.Where(
        (g) =>
          g.TenantId === tenantId2 &&
          g.IsSystemGroup === one2 &&
          g.Name === defaultGroupName,
      ).FirstOrDefaultAsync();
      if (sg2 === undefined) {
        return err("System group not found: " + defaultGroupName);
      }
      return ok(sg2.Id);
    }
    const settings = settingsOrNull;
    const value = settings[settingName];

    if (value !== undefined) {
      const parsed = parseId(value);
      if (parsed === undefined) {
        return err("Invalid group ID in settings: " + value);
      }
      return ok(parsed as long);
    }

    // Setting not found — resolve from defaults
    const defaultGroupName = PERMISSION_DEFAULTS[settingName];

    if (defaultGroupName === undefined) {
      return err("Unknown permission setting: " + settingName);
    }

    // Resolve the default group name to a group ID
    const tenantId1 = tenantId;
    const one = 1 as int;

    const systemGroup = await db0.UserGroups.Where(
      (g) =>
        g.TenantId === tenantId1 &&
        g.IsSystemGroup === one &&
        g.Name === defaultGroupName,
    ).FirstOrDefaultAsync();

    if (systemGroup === undefined) {
      return err("System group not found: " + defaultGroupName);
    }

    return ok(systemGroup.Id);
  } finally {
    db.Dispose();
  }
};
