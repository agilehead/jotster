import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { isDefaultChannel } from "../repo/is-default-channel.ts";
import { removeDefaultChannel } from "../repo/remove-default-channel.ts";

export const removeDefaultChannelDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  channelId: long,
): Promise<Result<boolean, string>> => {
  if (user.role > 200) {
    return err("Admin required");
  }

  const currentlyDefault = await isDefaultChannel(
    options,
    user.tenantId,
    channelId,
  );
  if (!currentlyDefault) {
    return err("Channel is not a default channel");
  }

  const result = await removeDefaultChannel(options, user.tenantId, channelId);
  return ok(result);
};
