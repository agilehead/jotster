import type { int } from "@tsonic/core/types.js";
import { express } from "@tsonic/express/index.js";
import { createNativeServerInfo, getNativeApiSurface } from "@jotster/api-native";
import { loadConfig } from "@jotster/core";
import { initNotificationRegistry } from "@jotster/notifications";
import {
  createPublicErrorResponse,
  getPublicErrorStatusCode,
  getSecurityPipelineDescription,
} from "./security-pipeline.ts";

export function main(): void {
  const config = loadConfig();
  const app = express.create();

  initNotificationRegistry();
  app.use(express.json({ limit: config.maxJsonBodyBytes }));

  app.get("/health", async (_req, res, _next) => {
    res.json({ ok: true, service: "jotster" });
  });

  app.get("/api", async (_req, res, _next) => {
    res.json({
      product: "jotster",
      mode: config.mode,
      security: getSecurityPipelineDescription(),
      api: getNativeApiSurface(),
    });
  });

  app.get("/api/v1/server", async (_req, res, _next) => {
    res.json(createNativeServerInfo(config.mode));
  });

  app.useError(async (err, _req, res, _next) => {
    const response = createPublicErrorResponse(err, config.production);
    const statusCode = getPublicErrorStatusCode(err);
    res.status(statusCode as int).json(response);
  });

  const urlParts = config.listenUrl.split(":");
  const lastPart = urlParts[urlParts.length - 1];
  const parsedPort = Number.parseInt(lastPart, 10);
  const port = Number.isNaN(parsedPort) ? (8080 as int) : (parsedPort as int);
  app.listen(port);
}
