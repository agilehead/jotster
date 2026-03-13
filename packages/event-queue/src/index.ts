// Types
export type { ClientCapabilities, RegisterParams, DomainEvent, QueueEvent, EventQueue } from "./types.ts";

// Registry
export {
  initRegistry,
  registerQueue,
  getEventsFromQueue,
  deleteQueueById,
  dispatchEvent,
  dispatchEventToUser,
  dispatchEventToTenant,
  getActiveQueueCount,
} from "./registry.ts";
