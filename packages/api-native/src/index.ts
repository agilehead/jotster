export interface ApiSurfaceDescription {
  id: string;
  audience: string;
  basePath: string;
  vocabulary: string;
  status: string;
  routes: string[];
}

export function getNativeApiRoutes(): string[] {
  return [
    "GET /api/v1/server",
    "GET /api/v1/workspace",
    "GET /api/v1/channels",
    "POST /api/v1/channels",
    "GET /api/v1/channels/{channelId}/threads",
    "POST /api/v1/channels/{channelId}/threads",
    "GET /api/v1/threads/{threadId}/messages",
    "POST /api/v1/messages",
    "GET /api/v1/direct-chats",
    "POST /api/v1/direct-chats",
    "GET /api/v1/participants",
    "GET /api/v1/notifications",
    "POST /api/v1/notifications/{notificationId}/read",
    "GET /api/v1/credentials",
    "POST /api/v1/credentials",
  ];
}

export function getNativeApiSurface(): ApiSurfaceDescription {
  return {
    id: "native",
    audience: "human_and_app_clients",
    basePath: "/api/v1",
    vocabulary: "jotster",
    status: "contract_ready",
    routes: getNativeApiRoutes(),
  };
}

export function createNativeServerInfo(mode: string): Record<string, string> {
  return {
    result: "success",
    product: "jotster",
    mode,
    workspaceRouting: "domain",
  };
}
