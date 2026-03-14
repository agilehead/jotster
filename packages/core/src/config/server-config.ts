export class ServerConfig {
  mode: string = "multi-tenant";
  listenUrl: string = "http://localhost:8080";
  database: string = "jotster.db";
  rootToken: string = "";
  jwtSecret: string = "";
  singleTenantId: string = "";
  uploadsDir: string = "";
}

export function createServerConfig(): ServerConfig {
  return new ServerConfig();
}
