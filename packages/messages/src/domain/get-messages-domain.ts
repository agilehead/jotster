import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { JotsterDbContext, ok, err } from "@jotster/core/Jotster.Core.js";
import { Convert } from "@tsonic/dotnet/System.js";
import { JsonSerializer } from "@tsonic/dotnet/System.Text.Json.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { getMessages } from "../repo/get-messages.ts";
import { getReactionsForMessage } from "../repo/get-reactions-for-message.ts";

interface NarrowFilter {
  operator: string;
  operand: string;
  negated?: boolean;
}

interface GetMessagesDomainInput {
  narrow?: string;
  anchor?: string;
  numBefore?: int;
  numAfter?: int;
  applyMarkdown?: boolean;
}

interface GetMessagesDomainResult {
  messages: Record<string, unknown>[];
  foundAnchor: boolean;
  foundNewest: boolean;
  foundOldest: boolean;
}

const parseNarrow = (narrowStr: string | undefined): NarrowFilter[] => {
  if (narrowStr === undefined || narrowStr.length === 0) {
    return [];
  }
  const parsed = JsonSerializer.Deserialize<NarrowFilter[]>(narrowStr);
  if (parsed === undefined) {
    return [];
  }
  return parsed;
};

const extractFilter = (
  filters: NarrowFilter[],
  operator: string,
): string | undefined => {
  for (let i = 0; i < filters.length; i++) {
    if (filters[i].operator === operator && filters[i].negated !== true) {
      return filters[i].operand;
    }
  }
  return undefined;
};

export const getMessagesDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  params: GetMessagesDomainInput,
): Promise<Result<GetMessagesDomainResult, string>> => {
  const filters = parseNarrow(params.narrow);

  // Extract filter values
  let channelId: long | undefined = undefined;
  let topic: string | undefined = undefined;
  let dmGroupId: string | undefined = undefined;
  let senderId: long | undefined = undefined;

  const streamOperand =
    extractFilter(filters, "stream") ?? extractFilter(filters, "channel");
  const topicOperand =
    extractFilter(filters, "topic") ?? extractFilter(filters, "subject");
  const dmOperand =
    extractFilter(filters, "dm") ?? extractFilter(filters, "pm-with");
  const senderOperand = extractFilter(filters, "sender");

  // Resolve channel name/ID
  if (streamOperand !== undefined) {
    const db = new JotsterDbContext(options);
    try {
      const db0 = db;
      const tenantId0 = user.tenantId;

      // Try as ID first (parse as long)
      const parsedId = parseInt(streamOperand, 10);
      let found = false;
      if (!isNaN(parsedId)) {
        const operandLong = Convert.ToInt64(parsedId) as long;
        const channel = await db0.Channels.Where(
          (c) => c.TenantId === tenantId0,
        )
          .Where((c) => c.Id === operandLong)
          .FirstOrDefaultAsync();

        if (channel !== undefined && channel !== null) {
          channelId = channel.Id;
          found = true;
        }
      }

      if (!found) {
        // Try as name
        const operand0 = streamOperand;
        const channel = await db0.Channels.Where(
          (c) => c.TenantId === tenantId0,
        )
          .Where((c) => c.Name === operand0)
          .FirstOrDefaultAsync();

        if (channel !== undefined && channel !== null) {
          channelId = channel.Id;
        } else {
          return err("Channel not found");
        }
      }
    } finally {
      db.Dispose();
    }
  }

  if (topicOperand !== undefined) {
    topic = topicOperand;
  }

  if (dmOperand !== undefined) {
    dmGroupId = dmOperand;
  }

  if (senderOperand !== undefined) {
    const parsedSender = parseInt(senderOperand, 10);
    if (!isNaN(parsedSender)) {
      senderId = Convert.ToInt64(parsedSender) as long;
    }
  }

  const anchor = params.anchor ?? "newest";
  const numBefore = params.numBefore ?? (100 as int);
  const numAfter = params.numAfter ?? (0 as int);
  const applyMarkdown = params.applyMarkdown !== false;

  // Fetch messages
  const messages = await getMessages(
    options,
    user.tenantId,
    channelId,
    topic,
    dmGroupId,
    senderId,
    anchor,
    numBefore,
    numAfter,
  );

  // Load flags for the requesting user
  const db2 = new JotsterDbContext(options);
  const userFlagMap: Record<string, List<string>> = {};
  const userFlagMapKeys = new List<string>();
  try {
    const db2_0 = db2;
    const userId0 = user.userId;
    const allFlags = await db2_0.MessageFlags.Where(
      (f) => f.UserId === userId0,
    ).ToListAsync();

    for (let i = 0; i < allFlags.Count; i++) {
      const flag = allFlags[i];
      const msgIdKey = flag.MessageId.toString();
      let keyExists = false;
      for (let k = 0; k < userFlagMapKeys.Count; k++) {
        if (userFlagMapKeys[k] === msgIdKey) {
          keyExists = true;
          break;
        }
      }
      if (!keyExists) {
        userFlagMap[msgIdKey] = new List<string>();
        userFlagMapKeys.Add(msgIdKey);
      }
      userFlagMap[msgIdKey].Add(flag.Flag);
    }
  } finally {
    db2.Dispose();
  }

  // Build formatted message objects
  const formattedMessages = new List<Record<string, unknown>>();
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    // Load reactions for this message
    const reactions = await getReactionsForMessage(
      options,
      user.tenantId,
      msg.Id,
    );
    const reactionList = new List<Record<string, unknown>>();
    for (let j = 0; j < reactions.length; j++) {
      const r = reactions[j];
      const reactionObj: Record<string, unknown> = {};
      reactionObj["emoji_name"] = r.EmojiName;
      reactionObj["emoji_code"] = r.EmojiCode;
      reactionObj["reaction_type"] = r.ReactionType;
      reactionObj["user_id"] = r.UserId;
      reactionList.Add(reactionObj);
    }

    // Get flags for this message
    const msgIdKey = msg.Id.toString();
    let hasFlags = false;
    for (let fi = 0; fi < userFlagMapKeys.Count; fi++) {
      if (userFlagMapKeys[fi] === msgIdKey) {
        hasFlags = true;
        break;
      }
    }
    const emptyFlags: string[] = [];
    const msgFlags = hasFlags ? userFlagMap[msgIdKey].ToArray() : emptyFlags;

    const formatted: Record<string, unknown> = {};
    formatted["id"] = msg.Id;
    formatted["sender_id"] = msg.SenderId;
    formatted["type"] = msg.Type === "stream" ? "stream" : "direct";
    formatted["content"] = applyMarkdown ? msg.RenderedContent : msg.Content;
    formatted["subject"] = msg.Topic ?? "";
    formatted["timestamp"] = Convert.ToDouble(msg.CreatedAt) / 1000;
    formatted["stream_id"] = msg.ChannelId;
    formatted["dm_group_id"] = msg.DmGroupId;
    formatted["reactions"] = reactionList.ToArray();
    formatted["flags"] = msgFlags;

    if (msg.Type === "stream") {
      formatted["display_recipient"] = msg.ChannelId;
    } else {
      formatted["display_recipient"] = msg.DmGroupId;
    }

    formattedMessages.Add(formatted);
  }

  // Determine pagination metadata
  const foundAnchor = anchor !== "newest" && anchor !== "oldest";
  const foundNewest = messages.length < numAfter || anchor === "newest";
  const foundOldest = messages.length < numBefore || anchor === "oldest";

  return ok({
    messages: formattedMessages.ToArray(),
    foundAnchor,
    foundNewest,
    foundOldest,
  });
};
