import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Message } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

export const getMessages = async (
  options: DbContextOptions,
  tenantId: string,
  channelId: string | undefined,
  topic: string | undefined,
  dmGroupId: string | undefined,
  senderId: string | undefined,
  anchorId: string | undefined,
  numBefore: int,
  numAfter: int
): Promise<Message[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const channelId0 = channelId;
    const topic0 = topic;
    const dmGroupId0 = dmGroupId;
    const senderId0 = senderId;
    const anchorId0 = anchorId;
    const numBefore0 = numBefore;
    const numAfter0 = numAfter;

    // Build base query with filters
    // We apply filters step by step since Tsonic lambda capture requires local consts

    if (anchorId0 === "newest" || anchorId0 === undefined) {
      // Get last N messages (numBefore count)
      if (channelId0 !== undefined && topic0 !== undefined) {
        if (senderId0 !== undefined) {
          const result = await db0.Messages
            .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0).Where((m) => m.Topic === topic0).Where((m) => m.SenderId === senderId0)
            .OrderByDescending((m) => m.Id)
            .Take(numBefore0)
            .ToArrayAsync();
          return reverseArray(result);
        }
        const result = await db0.Messages
          .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0).Where((m) => m.Topic === topic0)
          .OrderByDescending((m) => m.Id)
          .Take(numBefore0)
          .ToArrayAsync();
        return reverseArray(result);
      }

      if (channelId0 !== undefined) {
        if (senderId0 !== undefined) {
          const result = await db0.Messages
            .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0).Where((m) => m.SenderId === senderId0)
            .OrderByDescending((m) => m.Id)
            .Take(numBefore0)
            .ToArrayAsync();
          return reverseArray(result);
        }
        const result = await db0.Messages
          .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0)
          .OrderByDescending((m) => m.Id)
          .Take(numBefore0)
          .ToArrayAsync();
        return reverseArray(result);
      }

      if (dmGroupId0 !== undefined) {
        if (senderId0 !== undefined) {
          const result = await db0.Messages
            .Where((m) => m.TenantId === tenantId0).Where((m) => m.DmGroupId === dmGroupId0).Where((m) => m.SenderId === senderId0)
            .OrderByDescending((m) => m.Id)
            .Take(numBefore0)
            .ToArrayAsync();
          return reverseArray(result);
        }
        const result = await db0.Messages
          .Where((m) => m.TenantId === tenantId0).Where((m) => m.DmGroupId === dmGroupId0)
          .OrderByDescending((m) => m.Id)
          .Take(numBefore0)
          .ToArrayAsync();
        return reverseArray(result);
      }

      if (senderId0 !== undefined) {
        const result = await db0.Messages
          .Where((m) => m.TenantId === tenantId0).Where((m) => m.SenderId === senderId0)
          .OrderByDescending((m) => m.Id)
          .Take(numBefore0)
          .ToArrayAsync();
        return reverseArray(result);
      }

      const result = await db0.Messages
        .Where((m) => m.TenantId === tenantId0)
        .OrderByDescending((m) => m.Id)
        .Take(numBefore0)
        .ToArrayAsync();
      return reverseArray(result);
    }

    if (anchorId0 === "oldest") {
      // Get first N messages (numAfter count)
      if (channelId0 !== undefined && topic0 !== undefined) {
        if (senderId0 !== undefined) {
          const result = await db0.Messages
            .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0).Where((m) => m.Topic === topic0).Where((m) => m.SenderId === senderId0)
            .OrderBy((m) => m.Id)
            .Take(numAfter0)
            .ToArrayAsync();
          return result;
        }
        const result = await db0.Messages
          .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0).Where((m) => m.Topic === topic0)
          .OrderBy((m) => m.Id)
          .Take(numAfter0)
          .ToArrayAsync();
        return result;
      }

      if (channelId0 !== undefined) {
        if (senderId0 !== undefined) {
          const result = await db0.Messages
            .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0).Where((m) => m.SenderId === senderId0)
            .OrderBy((m) => m.Id)
            .Take(numAfter0)
            .ToArrayAsync();
          return result;
        }
        const result = await db0.Messages
          .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0)
          .OrderBy((m) => m.Id)
          .Take(numAfter0)
          .ToArrayAsync();
        return result;
      }

      if (dmGroupId0 !== undefined) {
        if (senderId0 !== undefined) {
          const result = await db0.Messages
            .Where((m) => m.TenantId === tenantId0).Where((m) => m.DmGroupId === dmGroupId0).Where((m) => m.SenderId === senderId0)
            .OrderBy((m) => m.Id)
            .Take(numAfter0)
            .ToArrayAsync();
          return result;
        }
        const result = await db0.Messages
          .Where((m) => m.TenantId === tenantId0).Where((m) => m.DmGroupId === dmGroupId0)
          .OrderBy((m) => m.Id)
          .Take(numAfter0)
          .ToArrayAsync();
        return result;
      }

      if (senderId0 !== undefined) {
        const result = await db0.Messages
          .Where((m) => m.TenantId === tenantId0).Where((m) => m.SenderId === senderId0)
          .OrderBy((m) => m.Id)
          .Take(numAfter0)
          .ToArrayAsync();
        return result;
      }

      const result = await db0.Messages
        .Where((m) => m.TenantId === tenantId0)
        .OrderBy((m) => m.Id)
        .Take(numAfter0)
        .ToArrayAsync();
      return result;
    }

    // Anchor-based: fetch before and after separately
    const beforeMessages = await fetchBefore(db0, tenantId0, channelId0, topic0, dmGroupId0, senderId0, anchorId0, numBefore0);
    const afterMessages = await fetchAfter(db0, tenantId0, channelId0, topic0, dmGroupId0, senderId0, anchorId0, numAfter0);

    // Combine: before (reversed to chronological) + after (already chronological)
    const combined = new List<Message>();
    for (let i = 0; i < beforeMessages.length; i++) {
      combined.Add(beforeMessages[i]);
    }
    for (let i = 0; i < afterMessages.length; i++) {
      combined.Add(afterMessages[i]);
    }
    return combined.ToArray();
  } finally {
    db.Dispose();
  }
};

const fetchBefore = async (
  db0: JotsterDbContext,
  tenantId0: string,
  channelId0: string | undefined,
  topic0: string | undefined,
  dmGroupId0: string | undefined,
  senderId0: string | undefined,
  anchorId0: string,
  numBefore0: int
): Promise<Message[]> => {
  if (numBefore0 === (0 as int)) {
    return [];
  }

  if (channelId0 !== undefined && topic0 !== undefined) {
    if (senderId0 !== undefined) {
      const result = await db0.Messages
        .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0).Where((m) => m.Topic === topic0).Where((m) => m.SenderId === senderId0).Where((m) => m.Id < anchorId0)
        .OrderByDescending((m) => m.Id)
        .Take(numBefore0)
        .ToArrayAsync();
      return reverseArray(result);
    }
    const result = await db0.Messages
      .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0).Where((m) => m.Topic === topic0).Where((m) => m.Id < anchorId0)
      .OrderByDescending((m) => m.Id)
      .Take(numBefore0)
      .ToArrayAsync();
    return reverseArray(result);
  }

  if (channelId0 !== undefined) {
    if (senderId0 !== undefined) {
      const result = await db0.Messages
        .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0).Where((m) => m.SenderId === senderId0).Where((m) => m.Id < anchorId0)
        .OrderByDescending((m) => m.Id)
        .Take(numBefore0)
        .ToArrayAsync();
      return reverseArray(result);
    }
    const result = await db0.Messages
      .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0).Where((m) => m.Id < anchorId0)
      .OrderByDescending((m) => m.Id)
      .Take(numBefore0)
      .ToArrayAsync();
    return reverseArray(result);
  }

  if (dmGroupId0 !== undefined) {
    if (senderId0 !== undefined) {
      const result = await db0.Messages
        .Where((m) => m.TenantId === tenantId0).Where((m) => m.DmGroupId === dmGroupId0).Where((m) => m.SenderId === senderId0).Where((m) => m.Id < anchorId0)
        .OrderByDescending((m) => m.Id)
        .Take(numBefore0)
        .ToArrayAsync();
      return reverseArray(result);
    }
    const result = await db0.Messages
      .Where((m) => m.TenantId === tenantId0).Where((m) => m.DmGroupId === dmGroupId0).Where((m) => m.Id < anchorId0)
      .OrderByDescending((m) => m.Id)
      .Take(numBefore0)
      .ToArrayAsync();
    return reverseArray(result);
  }

  if (senderId0 !== undefined) {
    const result = await db0.Messages
      .Where((m) => m.TenantId === tenantId0).Where((m) => m.SenderId === senderId0).Where((m) => m.Id < anchorId0)
      .OrderByDescending((m) => m.Id)
      .Take(numBefore0)
      .ToArrayAsync();
    return reverseArray(result);
  }

  const result = await db0.Messages
    .Where((m) => m.TenantId === tenantId0).Where((m) => m.Id < anchorId0)
    .OrderByDescending((m) => m.Id)
    .Take(numBefore0)
    .ToArrayAsync();
  return reverseArray(result);
};

const fetchAfter = async (
  db0: JotsterDbContext,
  tenantId0: string,
  channelId0: string | undefined,
  topic0: string | undefined,
  dmGroupId0: string | undefined,
  senderId0: string | undefined,
  anchorId0: string,
  numAfter0: int
): Promise<Message[]> => {
  if (numAfter0 === (0 as int)) {
    return [];
  }

  if (channelId0 !== undefined && topic0 !== undefined) {
    if (senderId0 !== undefined) {
      const result = await db0.Messages
        .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0).Where((m) => m.Topic === topic0).Where((m) => m.SenderId === senderId0).Where((m) => m.Id > anchorId0)
        .OrderBy((m) => m.Id)
        .Take(numAfter0)
        .ToArrayAsync();
      return result;
    }
    const result = await db0.Messages
      .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0).Where((m) => m.Topic === topic0).Where((m) => m.Id > anchorId0)
      .OrderBy((m) => m.Id)
      .Take(numAfter0)
      .ToArrayAsync();
    return result;
  }

  if (channelId0 !== undefined) {
    if (senderId0 !== undefined) {
      const result = await db0.Messages
        .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0).Where((m) => m.SenderId === senderId0).Where((m) => m.Id > anchorId0)
        .OrderBy((m) => m.Id)
        .Take(numAfter0)
        .ToArrayAsync();
      return result;
    }
    const result = await db0.Messages
      .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0).Where((m) => m.Id > anchorId0)
      .OrderBy((m) => m.Id)
      .Take(numAfter0)
      .ToArrayAsync();
    return result;
  }

  if (dmGroupId0 !== undefined) {
    if (senderId0 !== undefined) {
      const result = await db0.Messages
        .Where((m) => m.TenantId === tenantId0).Where((m) => m.DmGroupId === dmGroupId0).Where((m) => m.SenderId === senderId0).Where((m) => m.Id > anchorId0)
        .OrderBy((m) => m.Id)
        .Take(numAfter0)
        .ToArrayAsync();
      return result;
    }
    const result = await db0.Messages
      .Where((m) => m.TenantId === tenantId0).Where((m) => m.DmGroupId === dmGroupId0).Where((m) => m.Id > anchorId0)
      .OrderBy((m) => m.Id)
      .Take(numAfter0)
      .ToArrayAsync();
    return result;
  }

  if (senderId0 !== undefined) {
    const result = await db0.Messages
      .Where((m) => m.TenantId === tenantId0).Where((m) => m.SenderId === senderId0).Where((m) => m.Id > anchorId0)
      .OrderBy((m) => m.Id)
      .Take(numAfter0)
      .ToArrayAsync();
    return result;
  }

  const result = await db0.Messages
    .Where((m) => m.TenantId === tenantId0).Where((m) => m.Id > anchorId0)
    .OrderBy((m) => m.Id)
    .Take(numAfter0)
    .ToArrayAsync();
  return result;
};

const reverseArray = (arr: Message[]): Message[] => {
  const reversed = new List<Message>();
  for (let i = arr.length - 1; i >= 0; i--) {
    reversed.Add(arr[i]);
  }
  return reversed.ToArray();
};
