export class ServerConfig {
  mode: string = "multi-tenant";
  production: boolean = false;
  devAuthEnabled: boolean = true;
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
