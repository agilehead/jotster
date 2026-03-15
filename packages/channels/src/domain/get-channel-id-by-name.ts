import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { getChannelByName } from "../repo/get-channel-by-name.ts";

export const getChannelIdByName = async (
  options: DbContextOptions,
  tenantId: long,
  name: string
): Promise<Result<long, string>> => {
  const channel = await getChannelByName(options, tenantId, name);
  if (channel === undefined) {
    return err("No such channel");
  }
  return ok(channel.Id);
};
