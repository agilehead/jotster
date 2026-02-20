import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { checkPermission } from "./check-permission.ts";

export const canUserCreateChannel = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string,
  channelType: "public" | "private" | "web_public"
): Promise<Result<boolean, string>> => {
  if (channelType === "web_public") {
    return await checkPermission(
      options,
      tenantId,
      userId,
      "create_web_public_stream_policy"
    );
  }

  if (channelType === "private") {
    return await checkPermission(
      options,
      tenantId,
      userId,
      "create_private_stream_policy"
    );
  }

  return await checkPermission(
    options,
    tenantId,
    userId,
    "create_public_stream_policy"
  );
};
