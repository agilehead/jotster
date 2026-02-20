import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { getChannelById } from "../repo/get-channel-by-id.ts";
import { isDefaultChannel } from "../repo/is-default-channel.ts";
import { addDefaultChannel } from "../repo/add-default-channel.ts";

export const addDefaultChannelDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  channelId: string
): Promise<Result<boolean, string>> => {
  if (user.role > 200) {
    return err("Admin required");
  }

  const channel = await getChannelById(options, channelId);
  if (channel === undefined) {
    return err("Channel not found");
  }

  const one = 1 as int;
  if (channel.IsArchived === one) {
    return err("Channel is archived");
  }

  const alreadyDefault = await isDefaultChannel(options, user.tenantId, channelId);
  if (alreadyDefault) {
    return err("Channel is already a default channel");
  }

  await addDefaultChannel(options, user.tenantId, channelId);
  return ok(true);
};
