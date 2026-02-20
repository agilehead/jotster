import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { getChannelById } from "../repo/get-channel-by-id.ts";
import { archiveChannel } from "../repo/archive-channel.ts";

export const archiveChannelDomain = async (
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
    return err("Channel is already archived");
  }

  const result = await archiveChannel(options, channelId);
  return ok(result);
};
