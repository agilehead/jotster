import type { int, long } from "@tsonic/core/types.js";
import { Convert } from "@tsonic/dotnet/System.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { AuthenticatedUser, Message, User } from "@jotster/core/Jotster.Core.js";
import { JotsterDbContext, parseId } from "@jotster/core/Jotster.Core.js";
import { addMessageFlags, getMessage, removeMessageFlags } from "@jotster/messages/Jotster.Messages.js";
import { getUser } from "@jotster/users/Jotster.Users.js";
import { toLong } from "./body.ts";

type NarrowFilter = {
  op: string;
  value: unknown;
  negated?: boolean;
};

type ResolvedNarrow = {
  streamId?: long;
  topic?: string;
  dmGroupId?: string;
  senderId?: long;
  unreadOnly: boolean;
};

type UpdateFlagsForNarrowInput = {
  anchor: string;
  includeAnchor: boolean;
  numBefore: int;
  numAfter: int;
  narrow: unknown;
  op: string;
  flag: string;
};

type UpdateFlagsForNarrowResult = {
  error?: string;
  payload?: Record<string, unknown>;
};

type MessagesMatchingNarrowResult = {
  error?: string;
  messagesJson?: string;
};

const VALID_FLAGS = ["read", "starred", "mentioned", "wildcard_mentioned", "has_alert_word", "historical"];

const getObjectField = (value: unknown, key: string): unknown => {
  if (value === null || value === undefined || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  for (const [entryKey, entryValue] of Object.entries(value)) {
    if (entryKey === key) {
      return entryValue;
    }
  }
  return undefined;
};

const parseNarrowFilters = (value: unknown): NarrowFilter[] | undefined => {
  if (value === undefined || value === null) {
    return [];
  }

  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  if (!Array.isArray(parsed)) {
    return undefined;
  }
  const entries = parsed as unknown[];

  const filters = new List<NarrowFilter>();
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (Array.isArray(entry)) {
      const tuple = entry as unknown[];
      if (tuple.length < 2 || typeof tuple[0] !== "string") {
        return undefined;
      }
      const filter: NarrowFilter = {
        op: tuple[0] as string,
        value: tuple[1],
      };
      filters.Add(filter);
      continue;
    }

    if (entry === null || typeof entry !== "object") {
      return undefined;
    }

    const operatorValue = getObjectField(entry, "operator");
    if (typeof operatorValue !== "string") {
      return undefined;
    }
    const operator = operatorValue as string;

    const filter: NarrowFilter = {
      op: operator,
      value: getObjectField(entry, "operand"),
      negated: getObjectField(entry, "negated") === true,
    };
    filters.Add(filter);
  }

  return filters.ToArray();
};

const getFilterOperand = (filters: NarrowFilter[], operator: string): unknown => {
  for (let i = 0; i < filters.length; i++) {
    const filter = filters[i];
    if (filter.op === operator && filter.negated !== true) {
      return filter.value;
    }
  }

  return undefined;
};

const toStringValue = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
    return `${value}`;
  }
  return undefined;
};

const resolveSenderId = async (
  options: DbContextOptions,
  tenantId: long,
  operand: unknown,
): Promise<long | undefined> => {
  const candidate = toStringValue(operand);
  if (candidate === undefined) {
    return undefined;
  }

  if (candidate.includes("@")) {
    const user = await getUserByEmailInTenant(options, tenantId, candidate);
    return user?.Id;
  }

  return parseId(candidate);
};

const getUserByEmailInTenant = async (
  options: DbContextOptions,
  tenantId: long,
  email: string,
): Promise<User | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = tenantId;
    const email0 = email;
    const user = await db.Users
      .Where((entry) => entry.TenantId === tenantId0)
      .Where((entry) => entry.Email === email0)
      .FirstOrDefaultAsync();
    return user ?? undefined;
  } finally {
    db.Dispose();
  }
};

const resolveNarrow = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  narrowValue: unknown,
): Promise<ResolvedNarrow | undefined> => {
  const filters = parseNarrowFilters(narrowValue);
  if (filters === undefined) {
    return undefined;
  }

  const streamOperand = getFilterOperand(filters, "stream") ?? getFilterOperand(filters, "channel");
  const topicOperand = getFilterOperand(filters, "topic") ?? getFilterOperand(filters, "subject");
  const dmOperand = getFilterOperand(filters, "dm") ?? getFilterOperand(filters, "pm-with");
  const senderOperand = getFilterOperand(filters, "sender");
  const isOperand = getFilterOperand(filters, "is");

  const resolved: ResolvedNarrow = {
    unreadOnly: false,
  };

  const streamValue = toStringValue(streamOperand);
  if (streamValue !== undefined) {
    resolved.streamId = await resolveChannelIdentifier(options, user.tenantId, streamValue);
    if (resolved.streamId === undefined) {
      return undefined;
    }
  }

  const topicValue = toStringValue(topicOperand);
  if (topicValue !== undefined) {
    resolved.topic = topicValue;
  }

  const dmValue = toStringValue(dmOperand);
  if (dmValue !== undefined) {
    resolved.dmGroupId = dmValue;
  }

  const senderId = await resolveSenderId(options, user.tenantId, senderOperand);
  if (senderOperand !== undefined && senderId === undefined) {
    return undefined;
  }
  resolved.senderId = senderId;

  const isValue = toStringValue(isOperand);
  if (isValue !== undefined && isValue === "unread") {
    resolved.unreadOnly = true;
  }

  return resolved;
};

const resolveChannelIdentifier = async (
  options: DbContextOptions,
  tenantId: long,
  operand: string,
): Promise<long | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = tenantId;

    const operandId = parseId(operand);
    if (operandId !== undefined) {
      const operandId0 = operandId;
      const channel = await db.Channels
        .Where((entry) => entry.TenantId === tenantId0)
        .Where((entry) => entry.Id === operandId0)
        .FirstOrDefaultAsync();
      if (channel !== undefined && channel !== null) {
        return channel.Id;
      }
    }

    const operand0 = operand;
    const channelByName = await db.Channels
      .Where((entry) => entry.TenantId === tenantId0)
      .Where((entry) => entry.Name === operand0)
      .FirstOrDefaultAsync();

    return channelByName?.Id;
  } finally {
    db.Dispose();
  }
};

const sortMessagesChronologically = (messages: Message[]): Message[] => {
  const copy = [...messages];
  copy.sort((left, right) => {
    const leftTime = Number(left.CreatedAt);
    const rightTime = Number(right.CreatedAt);
    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }
    if (left.Id < right.Id) return -1;
    if (left.Id > right.Id) return 1;
    return 0;
  });
  return copy;
};

const collectMessageIds = (messages: Message[]): long[] => {
  const result = new List<long>();
  for (let i = 0; i < messages.length; i++) {
    result.Add(messages[i].Id);
  }
  return result.ToArray();
};

const containsLongId = (values: long[], candidate: long): boolean => {
  for (let i = 0; i < values.length; i++) {
    if (values[i] === candidate) {
      return true;
    }
  }
  return false;
};

export const getMatchingMessagesForNarrow = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  narrowValue: unknown,
): Promise<Message[] | undefined> => {
  const resolved = await resolveNarrow(options, user, narrowValue);
  if (resolved === undefined) {
    return undefined;
  }

  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = user.tenantId;
    let messages: Message[];

    if (resolved.streamId !== undefined && resolved.topic !== undefined && resolved.senderId !== undefined) {
      messages = await db.Messages
        .Where((entry) => entry.TenantId === tenantId0)
        .Where((entry) => entry.ChannelId === resolved.streamId)
        .Where((entry) => entry.Topic === resolved.topic)
        .Where((entry) => entry.SenderId === resolved.senderId)
        .ToArrayAsync();
    } else if (resolved.streamId !== undefined && resolved.topic !== undefined) {
      messages = await db.Messages
        .Where((entry) => entry.TenantId === tenantId0)
        .Where((entry) => entry.ChannelId === resolved.streamId)
        .Where((entry) => entry.Topic === resolved.topic)
        .ToArrayAsync();
    } else if (resolved.streamId !== undefined && resolved.senderId !== undefined) {
      messages = await db.Messages
        .Where((entry) => entry.TenantId === tenantId0)
        .Where((entry) => entry.ChannelId === resolved.streamId)
        .Where((entry) => entry.SenderId === resolved.senderId)
        .ToArrayAsync();
    } else if (resolved.streamId !== undefined) {
      messages = await db.Messages
        .Where((entry) => entry.TenantId === tenantId0)
        .Where((entry) => entry.ChannelId === resolved.streamId)
        .ToArrayAsync();
    } else if (resolved.dmGroupId !== undefined && resolved.senderId !== undefined) {
      messages = await db.Messages
        .Where((entry) => entry.TenantId === tenantId0)
        .Where((entry) => entry.DmGroupId === resolved.dmGroupId)
        .Where((entry) => entry.SenderId === resolved.senderId)
        .ToArrayAsync();
    } else if (resolved.dmGroupId !== undefined) {
      messages = await db.Messages
        .Where((entry) => entry.TenantId === tenantId0)
        .Where((entry) => entry.DmGroupId === resolved.dmGroupId)
        .ToArrayAsync();
    } else if (resolved.senderId !== undefined) {
      messages = await db.Messages
        .Where((entry) => entry.TenantId === tenantId0)
        .Where((entry) => entry.SenderId === resolved.senderId)
        .ToArrayAsync();
    } else {
      messages = await db.Messages
        .Where((entry) => entry.TenantId === tenantId0)
        .ToArrayAsync();
    }

    const sortedMessages = sortMessagesChronologically(messages);
    if (!resolved.unreadOnly) {
      return sortedMessages;
    }

    const userId0 = user.userId;
    const readFlag = "read";
    const flags = await db.MessageFlags
      .Where((entry) => entry.UserId === userId0)
      .Where((entry) => entry.Flag === readFlag)
      .ToListAsync();

    const readIds: long[] = [];
    for (let i = 0; i < flags.Count; i++) {
      readIds.push(flags[i].MessageId);
    }

    const unreadMessages: Message[] = [];
    for (let i = 0; i < sortedMessages.length; i++) {
      const message = sortedMessages[i];
      if (!containsLongId(readIds, message.Id)) {
        unreadMessages.push(message);
      }
    }

    return unreadMessages;
  } finally {
    db.Dispose();
  }
};

const findAnchorIndex = (messages: Message[], anchor: string): number => {
  if (messages.length === 0) {
    return -1;
  }

  if (anchor === "newest") {
    return messages.length - 1;
  }
  if (anchor === "oldest") {
    return 0;
  }
  if (anchor === "first_unread") {
    return 0;
  }

  const anchorId = parseId(anchor);
  if (anchorId !== undefined) {
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].Id === anchorId) {
        return i;
      }
    }
  }

  return messages.length - 1;
};

export const updateFlagsForNarrow = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  input: UpdateFlagsForNarrowInput,
): Promise<UpdateFlagsForNarrowResult> => {
  if (!VALID_FLAGS.includes(input.flag)) {
    return { error: "Invalid flag" };
  }
  if (input.op !== "add" && input.op !== "remove") {
    return { error: "Invalid operation" };
  }

  const messages = await getMatchingMessagesForNarrow(options, user, input.narrow);
  if (messages === undefined) {
    return { error: "Invalid narrow" };
  }

  const anchorIndex = findAnchorIndex(messages, input.anchor);
  const selected: Message[] = [];
  if (anchorIndex >= 0) {
    for (let i = 0; i < messages.length; i++) {
      const beforeDistance = anchorIndex - i;
      const afterDistance = i - anchorIndex;
      if (i < anchorIndex && beforeDistance <= input.numBefore) {
        selected.push(messages[i]);
      } else if (i > anchorIndex && afterDistance <= input.numAfter) {
        selected.push(messages[i]);
      } else if (i === anchorIndex && input.includeAnchor) {
        selected.push(messages[i]);
      }
    }
  }

  const selectedIds = collectMessageIds(selected);
  const changedIds = await getIdsThatWouldChange(options, user.userId, selectedIds, input.flag, input.op);
  if (input.op === "add") {
    await addMessageFlags(options, user.userId, selectedIds, input.flag);
  } else {
    await removeMessageFlags(options, user.userId, selectedIds, input.flag);
  }

  const payload: Record<string, unknown> = {
    processed_count: selectedIds.length,
    updated_count: changedIds.length,
    first_processed_id: selected.length > 0 ? selected[0].Id : null,
    last_processed_id: selected.length > 0 ? selected[selected.length - 1].Id : null,
    found_oldest: selected.length === 0 || (anchorIndex >= 0 && selected[0].Id === messages[0].Id),
    found_newest: selected.length === 0 || (anchorIndex >= 0 && selected[selected.length - 1].Id === messages[messages.length - 1].Id),
  };

  if (input.op === "remove" && input.flag === "read") {
    payload["ignored_because_not_subscribed_channels"] = [];
  }

  return { payload };
};

const getIdsThatWouldChange = async (
  options: DbContextOptions,
  userId: long,
  messageIds: long[],
  flag: string,
  op: string,
): Promise<long[]> => {
  if (messageIds.length === 0) {
    return [];
  }

  const db = new JotsterDbContext(options);
  try {
    const userId0 = userId;
    const flag0 = flag;
    const existingFlags = await db.MessageFlags
      .Where((entry) => entry.UserId === userId0)
      .Where((entry) => entry.Flag === flag0)
      .ToListAsync();

    const existingIds: long[] = [];
    for (let i = 0; i < existingFlags.Count; i++) {
      existingIds.push(existingFlags[i].MessageId);
    }

    const changed: long[] = [];
    for (let i = 0; i < messageIds.length; i++) {
      const messageId = messageIds[i];
      const exists = containsLongId(existingIds, messageId);
      if ((op === "add" && !exists) || (op === "remove" && exists)) {
        changed.push(messageId);
      }
    }

    return changed;
  } finally {
    db.Dispose();
  }
};

export const markStreamAsRead = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  streamId: long,
): Promise<void> => {
  const messages = await getMatchingMessagesForNarrow(options, user, [
    { operator: "channel", operand: `${streamId}` },
    { operator: "is", operand: "unread" },
  ]);
  if (messages === undefined) {
    return;
  }
  await addMessageFlags(options, user.userId, collectMessageIds(messages), "read");
};

export const markTopicAsRead = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  streamId: long,
  topic: string,
): Promise<void> => {
  const messages = await getMatchingMessagesForNarrow(options, user, [
    { operator: "channel", operand: `${streamId}` },
    { operator: "topic", operand: topic },
    { operator: "is", operand: "unread" },
  ]);
  if (messages === undefined) {
    return;
  }
  await addMessageFlags(options, user.userId, collectMessageIds(messages), "read");
};

export const getMessagesMatchingNarrow = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  messageIds: long[],
  narrowValue: unknown,
): Promise<MessagesMatchingNarrowResult> => {
  const matchingMessages = await getMatchingMessagesForNarrow(options, user, narrowValue);
  if (matchingMessages === undefined) {
    return { error: "Invalid narrow" };
  }

  const matchingIds: long[] = [];
  for (let i = 0; i < matchingMessages.length; i++) {
    matchingIds.push(matchingMessages[i].Id);
  }

  const resultEntries: string[] = [];
  for (let i = 0; i < messageIds.length; i++) {
    const messageId = messageIds[i];
    if (!containsLongId(matchingIds, messageId)) {
      continue;
    }

    const message = await getMessage(options, user.tenantId, messageId);
    if (message === undefined) {
      continue;
    }

    resultEntries.push(`${JSON.stringify(messageId)}:${JSON.stringify({
      match_content: message.RenderedContent,
      match_subject: message.Topic ?? "",
    })}`);
  }

  return {
    messagesJson: `{${resultEntries.join(",")}}`,
  };
};
