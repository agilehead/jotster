import type { int, long } from "@tsonic/core/types.js";
import type { Action } from "@tsonic/dotnet/System.js";
import { DateTimeOffset, Math as ClrMath, Convert } from "@tsonic/dotnet/System.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { timers } from "@tsonic/nodejs/index.js";
import type { EventQueue, QueueEvent, DomainEvent, RegisterParams, ClientCapabilities } from "./types.ts";

// Module-level state (singleton)
// We maintain parallel lists of keys for iteration since Object.keys() isn't available in Tsonic
const queues: Record<string, EventQueue> = {};
const queueKeyList = new List<string>();
const userQueueIndex: Record<string, string[]> = {};
const userKeyList = new List<string>();
let nextQueueSeq = 0;
let heartbeatStarted = false;
let gcStarted = false;

const HEARTBEAT_INTERVAL_MS = 45000;
const GC_INTERVAL_MS = 60000;
const QUEUE_EXPIRY_MS = 600000; // 10 minutes
const LONG_POLL_TIMEOUT_MS = 90000;

const hasKey = (list: List<string>, key: string): boolean => {
  for (let i = 0; i < list.Count; i++) {
    if (list[i] === key) {
      return true;
    }
  }
  return false;
};

const getQueue = (key: string): EventQueue | undefined => {
  if (!hasKey(queueKeyList, key)) {
    return undefined;
  }
  return queues[key];
};

const getUserQueueIds = (key: string): string[] | undefined => {
  if (!hasKey(userKeyList, key)) {
    return undefined;
  }
  return userQueueIndex[key];
};

const hasObjectKey = (value: Record<string, unknown>, key: string): boolean => {
  for (const [entryKey] of Object.entries(value)) {
    if (entryKey === key) {
      return true;
    }
  }
  return false;
};

const removeFromKeyList = (list: List<string>, key: string): void => {
  const newList = new List<string>();
  for (let i = 0; i < list.Count; i++) {
    if (list[i] !== key) {
      newList.Add(list[i]);
    }
  }
  list.Clear();
  for (let i = 0; i < newList.Count; i++) {
    list.Add(newList[i]);
  }
};

const injectHeartbeat = (): void => {
  for (let i = 0; i < queueKeyList.Count; i++) {
    const queue = getQueue(queueKeyList[i]);
    if (queue === undefined) {
      continue;
    }
    queue.lastEventId = (queue.lastEventId + 1) as int;
    const evt: QueueEvent = { id: queue.lastEventId, type: "heartbeat" };
    queue.events.Add(evt);
    if (queue.waiterResolve !== undefined) {
      const resolve = queue.waiterResolve;
      queue.waiterResolve = undefined;
      resolve();
    }
  }
};

const gcQueues = (): void => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
  // Snapshot keys to avoid modifying list during iteration
  const keys = queueKeyList.ToArray();
  for (let i = 0; i < keys.length; i++) {
    const queue = getQueue(keys[i]);
    if (queue === undefined) {
      continue;
    }
    if (Convert.ToInt64(now) - Convert.ToInt64(queue.lastAccessTime) > QUEUE_EXPIRY_MS) {
      // Signal waiter so blocked long-poll returns
      if (queue.waiterResolve !== undefined) {
        const resolve = queue.waiterResolve;
        queue.waiterResolve = undefined;
        resolve();
      }
      // Remove from queues
      delete queues[keys[i]];
      removeFromKeyList(queueKeyList, keys[i]);
      // Remove from user index
      const userKey = queue.tenantId + ":" + queue.userId;
      const userQueues = getUserQueueIds(userKey);
      if (userQueues !== undefined) {
        const newList = new List<string>();
        for (let j = 0; j < userQueues.length; j++) {
          if (userQueues[j] !== keys[i]) {
            newList.Add(userQueues[j]);
          }
        }
        if (newList.Count > 0) {
          userQueueIndex[userKey] = newList.ToArray();
        } else {
          delete userQueueIndex[userKey];
          removeFromKeyList(userKeyList, userKey);
        }
      }
    }
  }
};

function waitForEventsImpl(queue: EventQueue, timeoutMs: int, resolve: (value: boolean) => void): void {
  let settled = false;

  const onTimeout = (): void => {
    if (!settled) {
      settled = true;
      if (queue.waiterResolve !== undefined) {
        queue.waiterResolve = undefined;
      }
      resolve(false);
    }
  };

  timers.setTimeout(onTimeout as Action, timeoutMs);

  queue.waiterResolve = (): void => {
    if (!settled) {
      settled = true;
      resolve(true);
    }
  };
}

function waitForEvents(queue: EventQueue, timeoutMs: int): Promise<boolean> {
  return new Promise<boolean>((resolve: (value: boolean) => void) => {
    waitForEventsImpl(queue, timeoutMs, resolve);
  });
}

export function initRegistry(): void {
  if (!heartbeatStarted) {
    heartbeatStarted = true;
    timers.setInterval(injectHeartbeat as Action, HEARTBEAT_INTERVAL_MS as int);
  }
  if (!gcStarted) {
    gcStarted = true;
    timers.setInterval(gcQueues as Action, GC_INTERVAL_MS as int);
  }
}

export function registerQueue(tenantId: string, userId: string, params: RegisterParams): string {
  const nowSec = ClrMath.Floor(Convert.ToDouble(DateTimeOffset.UtcNow.ToUnixTimeSeconds()));
  const queueId = Convert.ToString(nowSec) + ":" + Convert.ToString(nextQueueSeq);
  nextQueueSeq = nextQueueSeq + 1;

  const queue: EventQueue = {
    queueId,
    tenantId,
    userId,
    eventTypes: params.eventTypes !== undefined ? params.eventTypes : undefined,
    lastEventId: -1 as int,
    events: new List<QueueEvent>(),
    lastAccessTime: DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
    narrow: params.narrow !== undefined ? params.narrow : undefined,
    allPublicStreams: params.allPublicStreams === true,
    applyMarkdown: params.applyMarkdown !== false,
    clientGravatar: params.clientGravatar === true,
    slimPresence: params.slimPresence === true,
    clientCapabilities: params.clientCapabilities !== undefined ? params.clientCapabilities : {} as ClientCapabilities,
    waiterResolve: undefined,
  };

  queues[queueId] = queue;
  queueKeyList.Add(queueId);

  const userKey = tenantId + ":" + userId;
  const existing = getUserQueueIds(userKey);
  if (existing !== undefined) {
    const updatedList = new List<string>();
    for (let ei = 0; ei < existing.length; ei++) {
      updatedList.Add(existing[ei]);
    }
    updatedList.Add(queueId);
    userQueueIndex[userKey] = updatedList.ToArray();
  } else {
    userQueueIndex[userKey] = [queueId];
    userKeyList.Add(userKey);
  }

  return queueId;
}

export async function getEventsFromQueue(
  tenantId: string,
  userId: string,
  queueId: string,
  lastEventId: int,
  dontBlock: boolean,
): Promise<{ events: QueueEvent[] } | { error: string; code?: string }> {
  const queue = getQueue(queueId);
  if (queue === undefined) {
    return {
      error: "Bad event queue id: " + queueId,
      code: "BAD_EVENT_QUEUE_ID",
    };
  }

  // Validate ownership
  if (queue.tenantId !== tenantId || queue.userId !== userId) {
    return {
      error: "Bad event queue id: " + queueId,
      code: "BAD_EVENT_QUEUE_ID",
    };
  }

  // Update last access time
  queue.lastAccessTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

  // Remove consumed events (id <= lastEventId) from buffer
  const remaining = new List<QueueEvent>();
  for (let i = 0; i < queue.events.Count; i++) {
    if (queue.events[i].id > lastEventId) {
      remaining.Add(queue.events[i]);
    }
  }
  queue.events = remaining;

  // Collect events with id > lastEventId
  const pendingEvents = new List<QueueEvent>();
  for (let i = 0; i < queue.events.Count; i++) {
    if (queue.events[i].id > lastEventId) {
      pendingEvents.Add(queue.events[i]);
    }
  }

  if (pendingEvents.Count > 0) {
    return { events: pendingEvents.ToArray() };
  }

  if (dontBlock) {
    return { events: [] };
  }

  // Long-poll: wait for signal or timeout
  await waitForEvents(queue, LONG_POLL_TIMEOUT_MS as int);

  // After wake, collect any new events
  const newEvents = new List<QueueEvent>();
  for (let i = 0; i < queue.events.Count; i++) {
    if (queue.events[i].id > lastEventId) {
      newEvents.Add(queue.events[i]);
    }
  }

  return { events: newEvents.ToArray() };
}

export function deleteQueueById(
  tenantId: string,
  userId: string,
  queueId: string,
): { success: boolean; error?: string } {
  const queue = getQueue(queueId);
  if (queue === undefined) {
    return {
      success: false,
      error: "Bad event queue id: " + queueId,
    };
  }

  // Validate ownership
  if (queue.tenantId !== tenantId || queue.userId !== userId) {
    return {
      success: false,
      error: "Bad event queue id: " + queueId,
    };
  }

  // Signal waiter if any so blocked long-poll returns
  if (queue.waiterResolve !== undefined) {
    const resolve = queue.waiterResolve;
    queue.waiterResolve = undefined;
    resolve();
  }

  // Remove from queues
  delete queues[queueId];
  removeFromKeyList(queueKeyList, queueId);

  // Remove from userQueueIndex
  const userKey = tenantId + ":" + userId;
  const userQueues = getUserQueueIds(userKey);
  if (userQueues !== undefined) {
    const newList = new List<string>();
    for (let i = 0; i < userQueues.length; i++) {
      if (userQueues[i] !== queueId) {
        newList.Add(userQueues[i]);
      }
    }
    if (newList.Count > 0) {
      userQueueIndex[userKey] = newList.ToArray();
    } else {
      delete userQueueIndex[userKey];
      removeFromKeyList(userKeyList, userKey);
    }
  }

  return { success: true };
}

export function dispatchEvent(tenantId: string, event: DomainEvent, targetUserIds: string[]): void {
  for (let u = 0; u < targetUserIds.length; u++) {
    const userKey = tenantId + ":" + targetUserIds[u];
    const queueIds = getUserQueueIds(userKey);
    if (queueIds === undefined) {
      continue;
    }

    for (let q = 0; q < queueIds.length; q++) {
      const queue = getQueue(queueIds[q]);
      if (queue === undefined) {
        continue;
      }

      // Check event_types filter
      if (queue.eventTypes !== undefined) {
        let matched = false;
        for (let e = 0; e < queue.eventTypes.length; e++) {
          if (queue.eventTypes[e] === event.type) {
            matched = true;
            break;
          }
        }
        if (!matched) {
          continue;
        }
      }

      if (event.type === "realm_linkifiers" && queue.clientCapabilities.linkifierUrlTemplate !== true) {
        continue;
      }

      if (
        event.type === "typing"
        && hasObjectKey(event.data, "stream_id")
        && queue.clientCapabilities.streamTypingNotifications !== true
      ) {
        continue;
      }

      // Build QueueEvent
      queue.lastEventId = (queue.lastEventId + 1) as int;
      const queueEvent: QueueEvent = {
        id: queue.lastEventId,
        type: event.type,
      };
      if (event.op !== undefined) {
        queueEvent.op = event.op;
      }
      queueEvent.data = event.data;
      for (const [key, value] of Object.entries(event.data)) {
        if (key === "op" && queueEvent.op === undefined && typeof value === "string") {
          queueEvent.op = value as string;
          break;
        }
      }
      queue.events.Add(queueEvent);

      // Signal waiter if any
      if (queue.waiterResolve !== undefined) {
        const resolve = queue.waiterResolve;
        queue.waiterResolve = undefined;
        resolve();
      }
    }
  }
}

export function dispatchEventToUser(tenantId: string, userId: string, event: DomainEvent): void {
  dispatchEvent(tenantId, event, [userId]);
}

export function dispatchEventToTenant(tenantId: string, event: DomainEvent): void {
  const prefix = tenantId + ":";
  const targetUserIds = new List<string>();

  for (let i = 0; i < userKeyList.Count; i++) {
    const key = userKeyList[i];
    if (key.length > prefix.length && key.substring(0, prefix.length) === prefix) {
      const userId = key.substring(prefix.length);
      targetUserIds.Add(userId);
    }
  }

  dispatchEvent(tenantId, event, targetUserIds.ToArray());
}

export function getActiveQueueCount(): number {
  return queueKeyList.Count;
}
