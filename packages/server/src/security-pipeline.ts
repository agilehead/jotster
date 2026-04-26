import {
  RequestContext,
  ServerConfig,
  createBootstrapDbContext,
  createDbOptions,
  createWorkspaceDbContext,
} from "@jotster/core";
import type {
  JotsterBootstrapDbContext,
  JotsterWorkspaceDbContext,
} from "@jotster/core";
import {
  authenticateApiCredential,
  authenticateSession,
  hashAuthenticatorSecret,
  resolveWorkspaceIdByDomain,
} from "@jotster/identity";
import type { long } from "@tsonic/core/types.js";

export const AUTH_KIND_SESSION = "session";
export const AUTH_KIND_API_CREDENTIAL = "api_credential";

export interface PublicRouteDescription {
  method: string;
  path: string;
  reason: string;
}

export interface SecurityRequestInput {
  config: ServerConfig;
  method: string;
  path: string;
  host: string;
  forwardedHost?: string;
  authorization?: string;
  audience: string;
  nowMs: long;
}

export interface ParsedAuthenticator {
  kind: string;
  rawSecret: string;
}

export interface RequestSecurityContext {
  domain: string;
  workspaceId: string;
  requestContext: RequestContext;
  bootstrapDb: JotsterBootstrapDbContext;
  workspaceDb: JotsterWorkspaceDbContext;
}

export class PublicHttpError extends Error {
  StatusCode: number;
  Code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.StatusCode = statusCode;
    this.Code = code;
  }
}

export function getPublicRouteDescriptions(): PublicRouteDescription[] {
  return [
    { method: "GET", path: "/health", reason: "health probe" },
    { method: "GET", path: "/api", reason: "API index" },
    { method: "GET", path: "/api/native/v1/server", reason: "native API server info" },
    { method: "GET", path: "/api/agent/v1/server", reason: "agent API server info" },
    { method: "GET", path: "/api/zulip/v1/server_settings", reason: "Zulip edge server info" },
  ];
}

export function isPublicRoute(method: string, path: string): boolean {
  const routes = getPublicRouteDescriptions();
  for (let index = 0; index < routes.length; index++) {
    const route = routes[index];
    if (route.method === method.toUpperCase() && route.path === path) {
      return true;
    }
  }
  return false;
}

function isDigit(value: string): boolean {
  return value >= "0" && value <= "9";
}

function rejectInvalidHostSyntax(host: string): void {
  if (
    host.indexOf("://") >= 0 ||
    host.indexOf("/") >= 0 ||
    host.indexOf("\\") >= 0 ||
    host.indexOf("?") >= 0 ||
    host.indexOf("#") >= 0 ||
    host.indexOf("@") >= 0 ||
    host.indexOf(",") >= 0
  ) {
    throw new PublicHttpError(400, "invalid_host", "Invalid host");
  }
}

function stripOptionalPort(host: string): string {
  const colonIndex = host.lastIndexOf(":");
  if (colonIndex < 0) {
    return host;
  }
  if (host.indexOf(":") !== colonIndex || colonIndex === 0) {
    throw new PublicHttpError(400, "invalid_host", "Invalid host");
  }
  const port = host.substring(colonIndex + 1);
  if (port.length === 0) {
    throw new PublicHttpError(400, "invalid_host", "Invalid host");
  }
  for (let index = 0; index < port.length; index++) {
    if (!isDigit(port[index])) {
      throw new PublicHttpError(400, "invalid_host", "Invalid host");
    }
  }
  return host.substring(0, colonIndex);
}

function rejectInvalidHostCharacters(host: string): void {
  for (let index = 0; index < host.length; index++) {
    const char = host[index];
    const valid =
      (char >= "a" && char <= "z") ||
      (char >= "0" && char <= "9") ||
      char === "." ||
      char === "-";
    if (!valid) {
      throw new PublicHttpError(400, "invalid_host", "Invalid host");
    }
  }
}

export function canonicalizeRequestHost(host: string): string {
  let normalized = host.trim().toLowerCase();
  if (normalized.length === 0) {
    throw new PublicHttpError(400, "invalid_host", "Invalid host");
  }
  rejectInvalidHostSyntax(normalized);
  normalized = stripOptionalPort(normalized);
  rejectInvalidHostCharacters(normalized);
  if (
    normalized.startsWith(".") ||
    normalized.endsWith(".") ||
    normalized.indexOf("..") >= 0
  ) {
    throw new PublicHttpError(400, "invalid_host", "Invalid host");
  }
  const labels = normalized.split(".");
  for (let index = 0; index < labels.length; index++) {
    const label = labels[index];
    if (label.length === 0 || label.startsWith("-") || label.endsWith("-")) {
      throw new PublicHttpError(400, "invalid_host", "Invalid host");
    }
  }
  return normalized;
}

export function selectTrustedHost(
  host: string,
  forwardedHost: string | undefined,
  behindTrustedTlsProxy: boolean,
): string {
  if (behindTrustedTlsProxy && forwardedHost !== undefined && forwardedHost.trim().length > 0) {
    return canonicalizeRequestHost(forwardedHost);
  }
  return canonicalizeRequestHost(host);
}

export function parseAuthorizationHeader(
  authorization: string | undefined,
): ParsedAuthenticator | undefined {
  if (authorization === undefined || authorization.trim().length === 0) {
    return undefined;
  }
  const normalized = authorization.trim();
  if (normalized.startsWith("Session ")) {
    return { kind: AUTH_KIND_SESSION, rawSecret: normalized.substring("Session ".length).trim() };
  }
  if (normalized.startsWith("ApiKey ")) {
    return { kind: AUTH_KIND_API_CREDENTIAL, rawSecret: normalized.substring("ApiKey ".length).trim() };
  }
  if (normalized.startsWith("Bearer ")) {
    return { kind: AUTH_KIND_API_CREDENTIAL, rawSecret: normalized.substring("Bearer ".length).trim() };
  }
  throw new PublicHttpError(401, "unsupported_authenticator", "Unsupported authenticator");
}

function createWorkspaceOnlyContext(
  workspaceId: string,
  domain: string,
  audience: string,
): RequestContext {
  const context = new RequestContext();
  context.WorkspaceId = workspaceId;
  context.Domain = domain;
  context.Audience = audience;
  context.AuthKind = "unresolved";
  context.IdentityId = "";
  context.WorkspaceMemberId = "";
  context.ParticipantId = "";
  context.Scopes = [];
  return context;
}

export async function createRequestSecurityContext(
  input: SecurityRequestInput,
): Promise<RequestSecurityContext | undefined> {
  if (isPublicRoute(input.method, input.path)) {
    return undefined;
  }

  const domain = selectTrustedHost(
    input.host,
    input.forwardedHost,
    input.config.behindTrustedTlsProxy,
  );
  const bootstrapDb = createBootstrapDbContext(createDbOptions(input.config.database));
  const workspaceId = await resolveWorkspaceIdByDomain(bootstrapDb, domain);
  if (workspaceId === undefined) {
    throw new PublicHttpError(404, "unknown_domain", "Unknown domain");
  }
  const workspace = await bootstrapDb.Workspaces.Where(
    (entry) => entry.Id === workspaceId && entry.State === "active",
  ).FirstOrDefaultAsync();
  if (workspace === undefined) {
    throw new PublicHttpError(404, "unknown_workspace", "Unknown workspace");
  }

  const unresolvedContext = createWorkspaceOnlyContext(workspaceId, domain, input.audience);
  const workspaceDb = createWorkspaceDbContext(
    createDbOptions(input.config.database),
    unresolvedContext,
  );
  const authenticator = parseAuthorizationHeader(input.authorization);
  if (authenticator === undefined) {
    throw new PublicHttpError(401, "unauthenticated", "Authentication required");
  }
  const authenticatorHash = hashAuthenticatorSecret(authenticator.rawSecret);
  let requestContext: RequestContext | undefined = undefined;
  if (authenticator.kind === AUTH_KIND_SESSION) {
    requestContext = await authenticateSession(
      workspaceDb,
      workspaceId,
      domain,
      input.audience,
      authenticatorHash,
      input.nowMs,
    );
  } else {
    requestContext = await authenticateApiCredential(
      workspaceDb,
      workspaceId,
      domain,
      input.audience,
      authenticatorHash,
      input.nowMs,
    );
  }
  if (requestContext === undefined) {
    throw new PublicHttpError(401, "unauthenticated", "Authentication failed");
  }
  return {
    domain,
    workspaceId,
    requestContext,
    bootstrapDb,
    workspaceDb,
  };
}

export function createPublicErrorResponse(error: unknown, production: boolean): Record<string, string> {
  if (error instanceof PublicHttpError) {
    return {
      result: "error",
      code: error.Code,
      message: error.message,
    };
  }
  if (production) {
    return {
      result: "error",
      code: "internal_error",
      message: "Internal server error",
    };
  }
  return {
    result: "error",
    code: "internal_error",
    message: String(error),
  };
}

export function getPublicErrorStatusCode(error: unknown): number {
  if (error instanceof PublicHttpError) {
    return error.StatusCode;
  }
  return 500;
}

export function getSecurityPipelineDescription(): Record<string, string> {
  return {
    order: "host -> workspace -> authenticator -> participant -> scoped_db -> authorization",
    hostTrust: "forwarded host is used only behind a trusted TLS proxy",
    defaultDb: "workspace-scoped",
    publicRoutes: getPublicRouteDescriptions().length.toString(),
  };
}
