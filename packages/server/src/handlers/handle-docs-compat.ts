import type { Request, Response } from "@tsonic/express/index.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleRealTimeCompat = async (
  _req: Request,
  res: Response,
  _app: AppContext,
): Promise<void> => {
  res.json({ result: "success", msg: "" });
};

export const handleRestErrorHandlingCompat = async (
  _req: Request,
  res: Response,
  _app: AppContext,
): Promise<void> => {
  res
    .status(400)
    .json({ result: "error", msg: "Bad request", code: "BAD_REQUEST" });
};

export const handleZulipOutgoingWebhookCompat = async (
  _req: Request,
  res: Response,
  _app: AppContext,
): Promise<void> => {
  res.json({ result: "success", msg: "" });
};
