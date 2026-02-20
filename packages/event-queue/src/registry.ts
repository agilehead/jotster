import type { int, long } from "@tsonic/core/types.js";
import type { Timeout } from "@tsonic/nodejs/index.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import type { EventQueue, QueueEvent, DomainEvent, RegisterParams, ClientCapabilities } from "./types.ts";

// Module-level state (singleton)
const queues: Record<string, EventQueue> = {};
const userQueueIndex: Record<string, string[]> = {}; // key: "tenantId:userId" -> queueId[]
let nextQueueSeq = 0;
let heartbeatTimer: Timeout | undefined = undefined;
let gcTimer: Timeout | undefined = undefined;

const HEARTBEAT_INTERVAL_MS = 45000;
const GC_INTERVAL_MS = 60000;
const QUEUE_EXPIRY_MS = 600000; // 10 minutes
const LONG_POLL_TIMEOUT_MS = 90000;

const injectHeartbeat = (): void => {
  const keys = Object.keys(queues);
  for (let i = 0; i < keys.length; i++) {
    const queue = queues[keys[i]];
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
  const keys = Object.keys(queues);
  for (let i = 0; i < keys.length; i++) {
    const queue = queues[keys[i]];
    if (Number(now) - Number(queue.lastAccessTime) > QUEUE_EXPIRY_MS) {
      // Signal waiter so blocked long-poll returns
      if (queue.waiterResolve !== undefined) {
        const resolve = queue.waiterResolve;
        queue.waiterResolve = undefined;
        resolve();
      }
      // Remove from queues
      delete queues[keys[i]];
      // Remove from user index
      const userKey = queue.tenantId + ":" + queue.userId;
      const userQueues = userQueueIndex[userKey];
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
        }
      }
    }
  }
};

const waitForEvents = (queue: EventQueue, timeoutMs: number): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      // Clear the waiter so nobody else tries to signal it
      if (queue.waiterResolve !== undefined) {
        queue.waiterResolve = undefined;
      }
      resolve(false);
    }, timeoutMs);

    queue.waiterResolve = () => {
      if (!timedOut) {
        clearTimeout(timer);
        resolve(true);
      }
    };
  });
};

export const initRegistry = (): void => {
  if (heartbeatTimer === undefined) {
    heartbeatTimer = setInterval(injectHeartbeat, HEARTBEAT_INTERVAL_MS);
  }
  if (gcTimer === undefined) {
    gcTimer = setInterval(gcQueues, GC_INTERVAL_MS);
  }
};

export const registerQueue = (tenantId: string, userId: string, params: RegisterParams): string => {
  const nowSec = Math.floor(Number(DateTimeOffset.UtcNow.ToUnixTimeSeconds()));
  const queueId = nowSec + ":" + nextQueueSeq;
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
    applyMarkdown: params.applyMarkdown !== false, // default true
    clientGravatar: params.clientGravatar === true,
    slimPresence: params.slimPresence === true,
    clientCapabilities: params.clientCapabilities !== undefined ? params.clientCapabilities : {},
  };

  queues[queueId] = queue;

  const userKey = tenantId + ":" + userId;
  const existing = userQueueIndex[userKey];
  if (existing !== undefined) {
    const updatedList = new List<string>();
    for (let ei = 0; ei < existing.length; ei++) {
      updatedList.Add(existing[ei]);
    }
    updatedList.Add(queueId);
    userQueueIndex[userKey] = updatedList.ToArray();
  } else {
    userQueueIndex[userKey] = [queueId];
  }

  return queueId;
};

export const getEventsFromQueue = async (
  tenantId: string,
  userId: string,
  queueId: string,
  lastEventId: int,
  dontBlock: boolean,
): Promise<{ events: QueueEvent[] } | { error: string; code?: string }> => {
  const queue = queues[queueId];
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
  await waitForEvents(queue, LONG_POLL_TIMEOUT_MS);

  // After wake, collect any new events
  const newEvents = new List<QueueEvent>();
  for (let i = 0; i < queue.events.Count; i++) {
    if (queue.events[i].id > lastEventId) {
      newEvents.Add(queue.events[i]);
    }
  }

  return { events: newEvents.ToArray() };
};

export const deleteQueueById = (
  tenantId: string,
  userId: string,
  queueId: string,
): { success: boolean; error?: string } => {
  const queue = queues[queueId];
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

  // Remove from userQueueIndex
  const userKey = tenantId + ":" + userId;
  const userQueues = userQueueIndex[userKey];
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
    }
  }

  return { success: true };
};

export const dispatchEvent = (tenantId: string, event: DomainEvent, targetUserIds: string[]): void => {
  for (let u = 0; u < targetUserIds.length; u++) {
    const userKey = tenantId + ":" + targetUserIds[u];
    const queueIds = userQueueIndex[userKey];
    if (queueIds === undefined) {
      continue;
    }

    for (let q = 0; q < queueIds.length; q++) {
      const queue = queues[queueIds[q]];
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

      // Build QueueEvent
      queue.lastEventId = (queue.lastEventId + 1) as int;
      const queueEvent: QueueEvent = {
        ...event.data,
        id: queue.lastEventId,
        type: event.type,
      };
      if (event.op !== undefined) {
        queueEvent.op = event.op;
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
};

export const dispatchEventToUser = (tenantId: string, userId: string, event: DomainEvent): void => {
  dispatchEvent(tenantId, event, [userId]);
};

export const dispatchEventToTenant = (tenantId: string, event: DomainEvent): void => {
  const prefix = tenantId + ":";
  const keys = Object.keys(userQueueIndex);
  const targetUserIds = new List<string>();
  const seen: Record<string, boolean> = {};

  for (let i = 0; i < keys.length; i++) {
    if (keys[i].length > prefix.length && keys[i].substring(0, prefix.length) === prefix) {
      const userId = keys[i].substring(prefix.length);
      if (seen[userId] === undefined) {
        seen[userId] = true;
        targetUserIds.Add(userId);
      }
    }
  }

  dispatchEvent(tenantId, event, targetUserIds.ToArray());
};

export const getActiveQueueCount = (): number => {
  return Object.keys(queues).length;
};
