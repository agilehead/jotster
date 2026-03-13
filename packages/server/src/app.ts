import type { int } from "@tsonic/core/types.js";
import { express } from "@tsonic/express/index.js";
import { loadConfig, createDbOptions } from "@jotster/core/Jotster.Core.js";
import { initRegistry } from "@jotster/event-queue/Jotster.EventQueue.js";
import type { AppContext } from "./helpers/app-context.ts";
import { toOptionalInt } from "./helpers/body.ts";
import { registerRoutes } from "./routes/register-routes.ts";

export function main(): void {
  const config = loadConfig();
  const options = createDbOptions(config.database);

  const app = express.create();

  // Initialize event queue system
  initRegistry();

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded());

  // Health check
  app.get("/health", async (_req, res, _next) => {
    res.json({ ok: true });
  });

  // App context with DB options and config
  const ctx: AppContext = { options, config };

  // Register all routes
  registerRoutes(app, ctx);

  // Error handler
  app.useError(async (err, _req, res, _next) => {
    res.status(500).json({ result: "error", msg: `Internal server error: ${err}` });
  });

  // Parse port from listenUrl (e.g., "http://localhost:8080" -> 8080)
  const urlParts = config.listenUrl.split(":");
  const parsedPort = urlParts.length >= 3 ? toOptionalInt(urlParts[urlParts.length - 1]) : undefined;
  if (urlParts.length >= 3 && parsedPort === undefined) {
    throw new Error("Invalid listenUrl port");
  }
  const port = parsedPort ?? (8080 as int);
  app.listen(port);
}
