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
    "GET /api/native/v1/server",
    "GET /api/native/v1/workspace",
    "GET /api/native/v1/channels",
    "POST /api/native/v1/channels",
    "GET /api/native/v1/channels/{channelId}/threads",
    "POST /api/native/v1/channels/{channelId}/threads",
    "GET /api/native/v1/threads/{threadId}/messages",
    "POST /api/native/v1/messages",
    "GET /api/native/v1/direct-chats",
    "POST /api/native/v1/direct-chats",
    "GET /api/native/v1/participants",
    "GET /api/native/v1/notifications",
    "POST /api/native/v1/notifications/{notificationId}/read",
    "GET /api/native/v1/credentials",
    "POST /api/native/v1/credentials",
  ];
}

export function getNativeApiSurface(): ApiSurfaceDescription {
  return {
    id: "native",
    audience: "human_and_app_clients",
    basePath: "/api/native/v1",
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
