export interface AgentApiSurfaceDescription {
  id: string;
  audience: string;
  basePath: string;
  notificationModel: string;
  executionModel: string;
  status: string;
  routes: string[];
}

export function getAgentApiRoutes(): string[] {
  return [
    "GET /api/agent/v1/server",
    "GET /api/agent/v1/notifications",
    "POST /api/agent/v1/notifications/{notificationId}/ack",
    "POST /api/agent/v1/messages",
    "GET /api/agent/v1/context",
    "GET /api/agent/v1/profile",
    "PATCH /api/agent/v1/profile",
    "GET /api/agent/v1/endpoints",
    "POST /api/agent/v1/endpoints",
    "DELETE /api/agent/v1/endpoints/{endpointId}",
  ];
}

export function getAgentApiSurface(): AgentApiSurfaceDescription {
  return {
    id: "agent",
    audience: "external_agent_processes",
    basePath: "/api/agent/v1",
    notificationModel: "participant_notifications",
    executionModel: "external",
    status: "contract_ready",
    routes: getAgentApiRoutes(),
  };
}

export function createAgentServerInfo(): Record<string, string> {
  return {
    result: "success",
    product: "jotster",
    agentExecution: "external",
    identityModel: "participant",
  };
}
