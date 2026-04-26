export class ServerConfig {
  mode: string = "domain-routed";
  environment: string = "development";
  production: boolean = false;
  devAuthEnabled: boolean = true;
  behindTrustedTlsProxy: boolean = false;
  listenUrl: string = "http://localhost:8080";
  database: string = "jotster.db";
  rootToken: string = "";
  jwtSecret: string = "";
  defaultWorkspaceId: string = "";
  uploadsDir: string = "";
  maxJsonBodyBytes: number = 1048576;
}

export function createServerConfig(): ServerConfig {
  return new ServerConfig();
}
