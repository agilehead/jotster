import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, UserTopic, generateId } from "@jotster/core/Jotster.Core.js";

export const setTopicVisibility = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
  channelId: long,
  topic: string,
  visibilityPolicy: int
): Promise<UserTopic | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const channelId0 = channelId;
    const topic0 = topic;
    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

    const existing = await db0.UserTopics
      .Where(
        (t) =>
          t.TenantId === tenantId0 &&
          t.UserId === userId0 &&
          t.ChannelId === channelId0 &&
          t.Topic === topic0
      )
      .FirstOrDefaultAsync();

    // If policy is 0 (inherit), delete existing row
    if (visibilityPolicy === (0 as int)) {
      if (existing !== undefined && existing !== null) {
        db0.UserTopics.Remove(existing);
        await db0.SaveChangesAsync();
      }
      return undefined;
    }

    // Upsert
    if (existing !== undefined && existing !== null) {
      existing.VisibilityPolicy = visibilityPolicy;
      existing.UpdatedAt = now;
      await db0.SaveChangesAsync();
      return existing;
    }

    const userTopic = new UserTopic();
    userTopic.Id = generateId();
    userTopic.TenantId = tenantId;
    userTopic.UserId = userId;
    userTopic.ChannelId = channelId;
    userTopic.Topic = topic;
    userTopic.VisibilityPolicy = visibilityPolicy;
    userTopic.UpdatedAt = now;
    db0.UserTopics.Add(userTopic);
    await db0.SaveChangesAsync();
    return userTopic;
  } finally {
    db.Dispose();
  }
};
