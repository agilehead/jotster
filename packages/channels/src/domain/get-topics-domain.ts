import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { JotsterDbContext, ok, err } from "@jotster/core/Jotster.Core.js";
import { List, Dictionary } from "@tsonic/dotnet/System.Collections.Generic.js";
import { getChannelById } from "../repo/get-channel-by-id.ts";

export const getTopicsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  channelId: string
): Promise<Result<{ name: string; maxId: string }[], string>> => {
  const channel = await getChannelById(options, channelId);
  if (channel === undefined) {
    return err("Channel not found");
  }

  const one = 1 as int;
  if (channel.IsPrivate === one) {
    if (user.role > 200) {
      const db2 = new JotsterDbContext(options);
      try {
        const db2_0 = db2;
        const tenantId0 = user.tenantId;
        const userId0 = user.userId;
        const channelId0 = channelId;
        const sub = await db2_0.Subscriptions
          .Where((s) => s.TenantId === tenantId0).Where((s) => s.UserId === userId0).Where((s) => s.ChannelId === channelId0)
          .FirstOrDefaultAsync();
        if (sub === undefined || sub === null) {
          return err("Channel not found");
        }
      } finally {
        db2.Dispose();
      }
    }
  }

  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const channelId1 = channelId;
    const messages = await db0.Messages
      .Where((m) => m.ChannelId === channelId1)
      .ToArrayAsync();

    const topicMap = new Dictionary<string, string>();
    for (let i = 0; i < messages.Length; i++) {
      const msg = messages[i];
      const topic = msg.Topic ?? "";
      if (!topicMap.ContainsKey(topic) || msg.Id > topicMap[topic]) {
        topicMap[topic] = msg.Id;
      }
    }

    const topics = new List<{ name: string; maxId: string }>();
    const topicKeys = topicMap.Keys;
    for (let i = 0; i < topicKeys.Length; i++) {
      const name = topicKeys[i];
      const maxId = topicMap[name];
      topics.Add({ name: name, maxId: maxId });
    }

    // Sort by maxId descending
    topics.Sort((a, b) => {
      if (a.maxId > b.maxId) return -1;
      if (a.maxId < b.maxId) return 1;
      return 0;
    });

    return ok(topics.ToArray());
  } finally {
    db.Dispose();
  }
};
