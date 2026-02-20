import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { setTopicVisibilityDomain } from "./set-topic-visibility-domain.ts";

interface LegacyMuteTopicParams {
  op: string;
  streamOrStreamId?: string;
  topic: string;
}

export const legacyMuteTopicDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  params: LegacyMuteTopicParams
): Promise<Result<void, string>> => {
  // Map op to visibility policy
  let visibilityPolicy: int;
  if (params.op === "add") {
    visibilityPolicy = 1 as int; // muted
  } else if (params.op === "remove") {
    visibilityPolicy = 0 as int; // inherit (unmute)
  } else {
    return err("Invalid op: must be 'add' or 'remove'");
  }

  if (params.streamOrStreamId === undefined) {
    return err("Stream or stream_id is required");
  }

  // Resolve channel by name or ID
  const db = new JotsterDbContext(options);
  let channelId: string | undefined;
  try {
    const db0 = db;
    const tenantId0 = user.tenantId;
    const streamRef0 = params.streamOrStreamId;

    // Try by ID first
    let channel = await db0.Channels
      .Where((c) => c.TenantId === tenantId0).Where((c) => c.Id === streamRef0)
      .FirstOrDefaultAsync();

    if (channel === undefined || channel === null) {
      // Try by name
      channel = await db0.Channels
        .Where((c) => c.TenantId === tenantId0).Where((c) => c.Name === streamRef0)
        .FirstOrDefaultAsync();
    }

    if (channel === undefined || channel === null) {
      return err("Channel not found");
    }

    channelId = channel.Id;
  } finally {
    db.Dispose();
  }

  // Delegate to setTopicVisibilityDomain
  return setTopicVisibilityDomain(options, user, {
    channelId,
    topic: params.topic,
    visibilityPolicy,
  });
};
