import { express } from "@tsonic/express/index.js";
import { loadConfig, createDbOptions } from "@jotster/core/Jotster.Core.js";
import { initRegistry } from "@jotster/event-queue/Jotster.EventQueue.js";
import type { AppContext } from "./helpers/app-context.ts";
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
  const urlParts = config.listenUrl.Split(":");
  const port = urlParts.Length >= 3 ? parseInt(urlParts[urlParts.Length - 1]) : 8080;
  app.listen(port);
}
