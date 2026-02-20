// Types
export type { ClientCapabilities, RegisterParams, DomainEvent, QueueEvent, EventQueue } from "./types.ts";

// Initial state
export { buildInitialState } from "./initial-state.ts";

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
