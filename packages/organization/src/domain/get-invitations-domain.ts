import type { int, JsValue } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { Convert } from "@tsonic/dotnet/System.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { JsonSerializer } from "@tsonic/dotnet/System.Text.Json.js";
import { getInvitations } from "../repo/get-invitations.ts";

export const getInvitationsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
): Promise<Result<Record<string, JsValue>[], string>> => {
  if (user.role > 200) {
    return err("Admin required");
  }

  const allInvitations = await getInvitations(options, user.tenantId);

  const result = new List<Record<string, JsValue>>();
  for (let i = 0; i < allInvitations.length; i++) {
    const inv = allInvitations[i];

    const obj: Record<string, JsValue> = {};
    obj["id"] = inv.Id;
    obj["invited_by_user_id"] = inv.InviterId;
    obj["email"] = inv.Email ?? "";
    obj["is_multiuse"] = inv.IsMultiuse === (1 as int);
    obj["link_token"] = inv.LinkToken;
    obj["channel_ids"] =
      inv.ChannelIdsJson.length > 0
        ? JsonSerializer.Deserialize<string[]>(inv.ChannelIdsJson)
        : [];
    obj["invited_as"] = inv.InvitedAsRole;
    obj["status"] = inv.Status;
    obj["timestamp"] = Convert.ToDouble(inv.CreatedAt) / 1000;
    if (inv.ExpiresAt !== undefined) {
      obj["expiry_date"] = Convert.ToDouble(inv.ExpiresAt) / 1000;
    }
    result.Add(obj);
  }

  return ok(result.ToArray());
};
