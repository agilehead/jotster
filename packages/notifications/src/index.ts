import {
  DeviceToken,
  Notification,
  NotificationDelivery,
  NotificationEndpoint,
  generateId,
} from "@jotster/core";
import type { RequestContext } from "@jotster/core";
import type { int, long } from "@tsonic/core/types.js";
import { Convert } from "@tsonic/dotnet/System.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { HMACSHA256 } from "@tsonic/dotnet/System.Security.Cryptography.js";
import { Encoding } from "@tsonic/dotnet/System.Text.js";

export const ENDPOINT_KIND_WEBSOCKET = "websocket";
export const ENDPOINT_KIND_EMAIL = "email";
export const ENDPOINT_KIND_PUSH = "push";
export const ENDPOINT_KIND_AGENT_WEBHOOK = "agent_webhook";
export const ENDPOINT_KIND_AGENT_POLL_QUEUE = "agent_poll_queue";

export const DELIVERY_STATUS_PENDING = "pending";
export const DELIVERY_STATUS_FAILED = "failed";
export const DELIVERY_STATUS_DELIVERED = "delivered";
export const MAX_DELIVERY_ATTEMPTS = 8;
export const MAX_QUEUE_IDLE_MS = 3600000;

export interface DomainEvent {
  workspaceId: string;
  participantId?: string;
  type: string;
  objectType: string;
  objectId: string;
  data: Record<string, string>;
}

export interface QueueEvent {
  id: int;
  event: DomainEvent;
}

export interface EventQueue {
  queueId: string;
  workspaceId: string;
  participantId: string;
  lastEventId: int;
  events: List<QueueEvent>;
  lastAccessTime: long;
}

export interface WebhookEndpointConfig {
  url: string;
  signingKeyId: string;
}

export interface WebhookSignatureHeaders {
  signature: string;
  timestamp: string;
  nonce: string;
  keyId: string;
}

const queues: Record<string, EventQueue> = {};

export function initNotificationRegistry(): void {}

function parseConfigJson(configJson: string): Record<string, unknown> {
  if (configJson.trim().length === 0) {
    return {};
  }
  const parsed = JSON.parse(configJson) as unknown;
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Notification endpoint config must be an object");
  }
  return parsed as Record<string, unknown>;
}

function getRequiredStringConfig(
  config: Record<string, unknown>,
  key: string,
): string {
  const value = config[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Notification endpoint config missing " + key);
  }
  return value.trim();
}

function extractHttpsHost(url: string): string {
  const normalized = url.trim().toLowerCase();
  if (!normalized.startsWith("https://")) {
    throw new Error("Webhook endpoint URL must use https");
  }
  let remainder = normalized.substring("https://".length);
  const pathIndex = remainder.search(/[/?#]/);
  if (pathIndex >= 0) {
    remainder = remainder.substring(0, pathIndex);
  }
  const atIndex = remainder.lastIndexOf("@");
  if (atIndex >= 0) {
    remainder = remainder.substring(atIndex + 1);
  }
  if (remainder.startsWith("[")) {
    const closeIndex = remainder.indexOf("]");
    if (closeIndex < 0) {
      throw new Error("Webhook endpoint URL host is invalid");
    }
    return remainder.substring(1, closeIndex);
  }
  const colonIndex = remainder.lastIndexOf(":");
  if (colonIndex > 0) {
    remainder = remainder.substring(0, colonIndex);
  }
  if (remainder.length === 0) {
    throw new Error("Webhook endpoint URL host is required");
  }
  return remainder;
}

function isPrivateIpv4Host(host: string): boolean {
  if (host === "0.0.0.0" || host.startsWith("127.")) {
    return true;
  }
  if (host.startsWith("10.") || host.startsWith("192.168.") || host.startsWith("169.254.")) {
    return true;
  }
  if (host.startsWith("172.")) {
    const parts = host.split(".");
    if (parts.length === 4) {
      const second = Number.parseInt(parts[1], 10);
      return second >= 16 && second <= 31;
    }
  }
  return false;
}

export function assertSafeWebhookUrl(url: string): void {
  const host = extractHttpsHost(url);
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "::1" ||
    host.indexOf(":") >= 0 ||
    isPrivateIpv4Host(host)
  ) {
    throw new Error("Webhook endpoint URL host is not allowed");
  }
}

export function validateNotificationEndpointConfig(
  kind: string,
  configJson: string,
): void {
  const config = parseConfigJson(configJson);
  if (
    kind !== ENDPOINT_KIND_WEBSOCKET &&
    kind !== ENDPOINT_KIND_EMAIL &&
    kind !== ENDPOINT_KIND_PUSH &&
    kind !== ENDPOINT_KIND_AGENT_WEBHOOK &&
    kind !== ENDPOINT_KIND_AGENT_POLL_QUEUE
  ) {
    throw new Error("Unsupported notification endpoint kind");
  }
  if (kind === ENDPOINT_KIND_AGENT_WEBHOOK) {
    const url = getRequiredStringConfig(config, "url");
    getRequiredStringConfig(config, "signingKeyId");
    assertSafeWebhookUrl(url);
  }
}

export function registerQueue(context: RequestContext, nowMs: long): string {
  const queueId = generateId("queue");
  queues[queueId] = {
    queueId,
    workspaceId: context.WorkspaceId,
    participantId: context.ParticipantId,
    lastEventId: 0 as int,
    events: new List<QueueEvent>(),
    lastAccessTime: nowMs,
  };
  return queueId;
}

export function cleanupExpiredQueues(nowMs: long): int {
  let removed = 0;
  const keys = Object.keys(queues);
  for (let index = 0; index < keys.length; index++) {
    const queue = queues[keys[index]];
    if (queue !== undefined && nowMs - queue.lastAccessTime > MAX_QUEUE_IDLE_MS) {
      delete queues[keys[index]];
      removed++;
    }
  }
  return removed as int;
}

export function dispatchEvent(event: DomainEvent): void {
  if (event.participantId === undefined) {
    throw new Error("Notification dispatch requires participant filtering");
  }
  const keys = Object.keys(queues);
  for (let index = 0; index < keys.length; index++) {
    const queue = queues[keys[index]];
    if (queue === undefined || queue.workspaceId !== event.workspaceId) {
      continue;
    }
    if (event.participantId !== undefined && queue.participantId !== event.participantId) {
      continue;
    }
    queue.lastEventId = (queue.lastEventId + 1) as int;
    queue.events.Add({ id: queue.lastEventId, event });
  }
}

function getAuthorizedQueue(context: RequestContext, queueId: string): EventQueue | undefined {
  const queue = queues[queueId];
  if (queue === undefined) {
    return undefined;
  }
  if (
    queue.workspaceId !== context.WorkspaceId ||
    queue.participantId !== context.ParticipantId
  ) {
    return undefined;
  }
  return queue;
}

export function getEventsFromQueue(
  context: RequestContext,
  queueId: string,
  nowMs: long,
): QueueEvent[] {
  const queue = getAuthorizedQueue(context, queueId);
  if (queue === undefined) {
    return [];
  }
  queue.lastAccessTime = nowMs;
  const events = queue.events.ToArray();
  queue.events.Clear();
  return events;
}

export function deleteQueueById(context: RequestContext, queueId: string): boolean {
  const queue = getAuthorizedQueue(context, queueId);
  if (queue === undefined) {
    return false;
  }
  delete queues[queueId];
  return true;
}

export function getActiveQueueCount(): int {
  return Object.keys(queues).length as int;
}

export function createNotificationRecord(
  workspaceId: string,
  participantId: string,
  activityType: string,
  objectType: string,
  objectId: string,
  reason: string,
  payloadJson: string,
  createdAt: long,
): Notification {
  const notification = new Notification();
  notification.Id = generateId("notif");
  notification.WorkspaceId = workspaceId;
  notification.ParticipantId = participantId;
  notification.ActivityType = activityType;
  notification.ObjectType = objectType;
  notification.ObjectId = objectId;
  notification.Reason = reason;
  notification.PayloadJson = payloadJson;
  notification.CreatedAt = createdAt;
  return notification;
}

export function createNotificationEndpointRecord(
  workspaceId: string,
  participantId: string,
  kind: string,
  configJson: string,
  createdAt: long,
): NotificationEndpoint {
  validateNotificationEndpointConfig(kind, configJson);
  const endpoint = new NotificationEndpoint();
  endpoint.Id = generateId("ne");
  endpoint.WorkspaceId = workspaceId;
  endpoint.ParticipantId = participantId;
  endpoint.Kind = kind;
  endpoint.ConfigJson = configJson;
  endpoint.Enabled = 1;
  endpoint.CreatedAt = createdAt;
  endpoint.UpdatedAt = createdAt;
  return endpoint;
}

export function createNotificationDeliveryRecord(
  workspaceId: string,
  participantId: string,
  notificationId: string,
  endpointId: string,
  createdAt: long,
): NotificationDelivery {
  const delivery = new NotificationDelivery();
  delivery.Id = generateId("nd");
  delivery.WorkspaceId = workspaceId;
  delivery.ParticipantId = participantId;
  delivery.NotificationId = notificationId;
  delivery.EndpointId = endpointId;
  delivery.Status = DELIVERY_STATUS_PENDING;
  delivery.Attempts = 0;
  delivery.CreatedAt = createdAt;
  delivery.UpdatedAt = createdAt;
  return delivery;
}

export function createParticipantNotificationDeliveryRecord(
  notification: Notification,
  endpoint: NotificationEndpoint,
  createdAt: long,
): NotificationDelivery {
  validateNotificationDeliveryOwnership(notification, endpoint);
  return createNotificationDeliveryRecord(
    notification.WorkspaceId,
    notification.ParticipantId,
    notification.Id,
    endpoint.Id,
    createdAt,
  );
}

export function validateNotificationDeliveryOwnership(
  notification: Notification,
  endpoint: NotificationEndpoint,
): void {
  if (notification.WorkspaceId !== endpoint.WorkspaceId) {
    throw new Error("Notification endpoint workspace mismatch");
  }
  if (notification.ParticipantId !== endpoint.ParticipantId) {
    throw new Error("Notification endpoint participant mismatch");
  }
}

export function computeNextRetryAt(nowMs: long, attempts: int): long | undefined {
  if (attempts >= MAX_DELIVERY_ATTEMPTS) {
    return undefined;
  }
  let delayMs = 1000;
  for (let index = 0; index < attempts; index++) {
    delayMs = delayMs * 2;
    if (delayMs > 3600000) {
      delayMs = 3600000;
    }
  }
  return (nowMs + delayMs) as long;
}

export function markDeliveryFailure(
  delivery: NotificationDelivery,
  error: string,
  nowMs: long,
): void {
  delivery.Attempts = (delivery.Attempts + 1) as int;
  delivery.LastError = error;
  delivery.UpdatedAt = nowMs;
  const nextRetryAt = computeNextRetryAt(nowMs, delivery.Attempts);
  if (nextRetryAt === undefined) {
    delivery.Status = DELIVERY_STATUS_FAILED;
    delivery.NextAttemptAt = undefined;
  } else {
    delivery.Status = DELIVERY_STATUS_PENDING;
    delivery.NextAttemptAt = nextRetryAt;
  }
}

export function markDeliverySuccess(
  delivery: NotificationDelivery,
  nowMs: long,
): void {
  delivery.Status = DELIVERY_STATUS_DELIVERED;
  delivery.LastError = undefined;
  delivery.NextAttemptAt = undefined;
  delivery.UpdatedAt = nowMs;
}

export function createWebhookSignatureHeaders(
  payloadJson: string,
  secret: string,
  signingKeyId: string,
  timestampMs: long,
  nonce: string,
): WebhookSignatureHeaders {
  if (secret.length < 32) {
    throw new Error("Webhook signing secret is too short");
  }
  if (nonce.length < 16) {
    throw new Error("Webhook signing nonce is too short");
  }
  const timestamp = timestampMs.toString();
  const signingPayload = timestamp + "." + nonce + "." + payloadJson;
  const signature = HMACSHA256.HashData(
    Encoding.UTF8.GetBytes(secret),
    Encoding.UTF8.GetBytes(signingPayload),
  );
  return {
    signature: "sha256=" + Convert.ToHexStringLower(signature),
    timestamp,
    nonce,
    keyId: signingKeyId,
  };
}

export function createDeviceTokenRecord(
  workspaceId: string,
  participantId: string,
  provider: string,
  tokenHash: string,
  createdAt: long,
): DeviceToken {
  const token = new DeviceToken();
  token.Id = generateId("dt");
  token.WorkspaceId = workspaceId;
  token.ParticipantId = participantId;
  token.Provider = provider;
  token.TokenHash = tokenHash;
  token.Enabled = 1;
  token.CreatedAt = createdAt;
  token.UpdatedAt = createdAt;
  return token;
}
