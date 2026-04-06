import type { JsValue, int, long } from "@tsonic/core/types.js";
import type { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import type { Action } from "@tsonic/dotnet/System.js";

export interface ClientCapabilities {
  notificationSettingsNull?: boolean;
  bulkMessageDeletion?: boolean;
  userAvatarUrlFieldOptional?: boolean;
  streamTypingNotifications?: boolean;
  userSettingsObject?: boolean;
  linkifierUrlTemplate?: boolean;
  groupSettingValue?: boolean;
  archivedChannels?: boolean;
  userListIncomplete?: boolean;
  includeDeactivatedGroups?: boolean;
}

export interface RegisterParams {
  eventTypes?: string[];
  fetchEventTypes?: string[];
  applyMarkdown?: boolean;
  clientGravatar?: boolean;
  slimPresence?: boolean;
  allPublicStreams?: boolean;
  narrow?: { operator: string; operand: string; negated?: boolean }[];
  clientCapabilities?: ClientCapabilities;
}

export interface DomainEvent {
  type: string;
  op?: string;
  data: Record<string, JsValue>;
}

export interface QueueEvent {
  id: int;
  type: string;
  op?: string;
  data?: Record<string, JsValue>;
}

export interface EventQueue {
  queueId: string;
  tenantId: long;
  userId: long;
  eventTypes: string[] | undefined;
  lastEventId: int;
  events: List<QueueEvent>;
  lastAccessTime: long;
  narrow:
    | { operator: string; operand: string; negated?: boolean }[]
    | undefined;
  allPublicStreams: boolean;
  applyMarkdown: boolean;
  clientGravatar: boolean;
  slimPresence: boolean;
  clientCapabilities: ClientCapabilities;
  waiterResolve: Action | undefined;
}
