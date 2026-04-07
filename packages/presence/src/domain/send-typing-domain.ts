import type { JsValue, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import {
  dispatchEventToTenant,
  dispatchEventToUser,
} from "@jotster/event-queue/Jotster.EventQueue.js";

interface SendTypingParams {
  op: string;
  type?: string;
  to?: long[];
  streamId?: long;
  topic?: string;
}

export const sendTypingDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  params: SendTypingParams,
): Promise<Result<void, string>> => {
  // Validate op
  if (params.op !== "start" && params.op !== "stop") {
    return err("Invalid op: must be 'start' or 'stop'");
  }

  const msgType = params.type ?? "direct";

  if (msgType === "direct" || msgType === "private") {
    // Direct/private typing notification
    if (params.to === undefined || params.to.length === 0) {
      return err("'to' is required for direct typing notifications");
    }

    // Parse user IDs from 'to' and dispatch typing event to each user
    for (let i = 0; i < params.to.length; i++) {
      const targetUserId = params.to[i];
      dispatchEventToUser(user.tenantId, targetUserId, {
        type: "typing",
        op: params.op,
        data: {
          sender: {
            user_id: user.userId,
            email: user.email,
          },
          recipients: params.to,
        },
      });
    }

    return ok(undefined);
  }

  if (msgType === "channel" || msgType === "stream") {
    // Channel/stream typing notification
    if (params.streamId === undefined) {
      return err("'stream_id' is required for channel typing notifications");
    }

    // Validate channel access
    const db = new JotsterDbContext(options);
    try {
      const db0 = db;
      const tenantId0 = user.tenantId;
      const streamId0 = params.streamId;
      const userId0 = user.userId;

      const channel = await db0.Channels.Where((c) => c.Id === streamId0)
        .Where((c) => c.TenantId === tenantId0)
        .FirstOrDefaultAsync();

      if (channel === undefined || channel === null) {
        return err("Channel not found");
      }

      // For private channels, check subscription
      if (channel.IsPrivate === 1) {
        const sub = await db0.Subscriptions.Where(
          (s) => s.TenantId === tenantId0,
        )
          .Where((s) => s.UserId === userId0)
          .Where((s) => s.ChannelId === streamId0)
          .FirstOrDefaultAsync();

        if (sub === undefined || sub === null) {
          return err("Not subscribed to this channel");
        }
      }

      const setting = await db0.UserSettings.Where(
        (entry) => entry.UserId === userId0,
      ).FirstOrDefaultAsync();
      if (
        setting !== undefined &&
        setting !== null &&
        setting.SendStreamTypingNotifications !== 1
      ) {
        return ok(undefined);
      }
    } finally {
      db.Dispose();
    }

    // Dispatch typing event to tenant
    const eventData: Record<string, JsValue> = {
      sender: {
        user_id: user.userId,
        email: user.email,
      },
      stream_id: params.streamId,
    };
    if (params.topic !== undefined) {
      eventData["topic"] = params.topic;
    }

    dispatchEventToTenant(user.tenantId, {
      type: "typing",
      op: params.op,
      data: eventData,
    });

    return ok(undefined);
  }

  return err(
    "Invalid type: must be 'direct', 'private', 'channel', or 'stream'",
  );
};
