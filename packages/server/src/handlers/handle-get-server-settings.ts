import type { Request, Response } from "@tsonic/express/index.js";
import {
  resolveTenant,
  getServerSettings,
} from "@jotster/auth/Jotster.Auth.js";
import type { AppContext } from "../helpers/app-context.ts";

const buildRealmUrl = (app: AppContext, req: Request): string => {
  const host = req.get("host") ?? "localhost";
  const scheme = app.config.listenUrl.startsWith("https://") ? "https" : "http";
  return `${scheme}://${host}`;
};

export const handleGetServerSettings = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const tenantResult = await resolveTenant(
    app.options,
    app.config,
    req.get("host") ?? "",
  );
  if (!tenantResult.success) {
    res.status(400).json({ result: "error", msg: tenantResult.error });
    return;
  }

  const settings = getServerSettings(
    tenantResult.data,
    buildRealmUrl(app, req),
    !app.config.production && app.config.devAuthEnabled,
  );
  res.json({ result: "success", msg: "", ...settings });
};
