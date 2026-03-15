import type { int, long } from "@tsonic/core/types.js";
import { Convert } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToUser } from "@jotster/event-queue/Jotster.EventQueue.js";
import { setTopicVisibility } from "../repo/set-topic-visibility.ts";

interface SetTopicVisibilityParams {
  channelId: long;
  topic: string;
  visibilityPolicy: int;
}

export const setTopicVisibilityDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  params: SetTopicVisibilityParams,
): Promise<Result<void, string>> => {
  const policy = Convert.ToInt32(params.visibilityPolicy);

  // Validate policy is 0-3
  if (policy < 0 || policy > 3) {
    return err(
      "Invalid visibility policy: must be 0 (inherit), 1 (muted), 2 (unmuted), or 3 (followed)",
    );
  }

  // Validate channel exists and user has access
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = user.tenantId;
    const channelId0 = params.channelId;
    const userId0 = user.userId;

    const channel = await db0.Channels.Where((c) => c.Id === channelId0)
      .Where((c) => c.TenantId === tenantId0)
      .FirstOrDefaultAsync();

    if (channel === undefined || channel === null) {
      return err("Channel not found");
    }

    // For private channels, check subscription
    if (channel.IsPrivate === 1) {
      const sub = await db0.Subscriptions.Where((s) => s.TenantId === tenantId0)
        .Where((s) => s.UserId === userId0)
        .Where((s) => s.ChannelId === channelId0)
        .FirstOrDefaultAsync();

      if (sub === undefined || sub === null) {
        return err("Not subscribed to this channel");
      }
    }
  } finally {
    db.Dispose();
  }

  await setTopicVisibility(
    options,
    user.tenantId,
    user.userId,
    params.channelId,
    params.topic,
    params.visibilityPolicy,
  );

  // Dispatch user_topic event to user
  dispatchEventToUser(user.tenantId, user.userId, {
    type: "user_topic",
    data: {
      stream_id: params.channelId,
      topic_name: params.topic,
      visibility_policy: params.visibilityPolicy,
    },
  });

  return ok(undefined);
};
