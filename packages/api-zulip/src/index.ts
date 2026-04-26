export interface ZulipApiSurfaceDescription {
  id: string;
  audience: string;
  basePath: string;
  role: string;
  storageOwnership: string;
  status: string;
  routes: string[];
}

export function getZulipApiRoutes(): string[] {
  return [
    "GET /api/zulip/v1/server_settings",
    "GET /api/zulip/v1/register",
    "GET /api/zulip/v1/events",
    "DELETE /api/zulip/v1/events",
    "GET /api/zulip/v1/messages",
    "POST /api/zulip/v1/messages",
    "PATCH /api/zulip/v1/messages/{messageId}",
    "GET /api/zulip/v1/users/me",
    "GET /api/zulip/v1/streams",
    "GET /api/zulip/v1/users/me/subscriptions",
  ];
}

export function getZulipApiSurface(): ZulipApiSurfaceDescription {
  return {
    id: "zulip",
    audience: "compatibility_clients",
    basePath: "/api/zulip/v1",
    role: "edge_adapter",
    storageOwnership: "none",
    status: "contract_ready",
    routes: getZulipApiRoutes(),
  };
}

export function createZulipServerSettings(): Record<string, string> {
  return {
    result: "success",
    adapter: "zulip",
    product: "jotster",
    compatibilityBoundary: "edge_only",
  };
}
