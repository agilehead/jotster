import { Convert } from "@tsonic/dotnet/System.js";
import { Encoding } from "@tsonic/dotnet/System.Text.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { handleSlackIncomingDomain } from "@jotster/webhooks/Jotster.Webhooks.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleSlackIncomingWebhook = async (
  req: Request,
  res: Response,
  app: AppContext
): Promise<void> => {
  // Authenticate via api_key query param OR authorization header
  const apiKey = req.query["api_key"] as string | undefined;
  let authHeader = req.get("authorization") ?? "";
  if (authHeader.Length === 0 && apiKey !== undefined && apiKey.Length > 0) {
    const email = req.body["email"] as string | undefined ?? req.query["email"] as string | undefined ?? "";
    if (email.Length > 0) {
      const credentials = email + ":" + apiKey;
      const encoded = Convert.ToBase64String(Encoding.UTF8.GetBytes(credentials));
      authHeader = "Basic " + encoded;
    }
  }

  const authResult = await authenticateRequest(app.options, authHeader);
  if (!authResult.success) {
    res.status(401).json({ result: "error", msg: authResult.error, code: "UNAUTHORIZED" });
    return;
  }

  const user = authResult.data;

  const stream = req.body["stream"] as string | undefined ?? req.query["stream"] as string | undefined;
  const topic = req.body["topic"] as string | undefined ?? req.query["topic"] as string | undefined;

  const result = await handleSlackIncomingDomain(app.options, user, {
    stream,
    topic,
    body: req.body as Record<string, unknown>,
  });

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const data = result.data;
  res.json({ result: "success", msg: "", id: data.id });
};
