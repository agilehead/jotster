import { Convert } from "@tsonic/dotnet/System.js";
import { Encoding } from "@tsonic/dotnet/System.Text.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { handleIncomingWebhookDomain } from "@jotster/webhooks/Jotster.Webhooks.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleIncomingWebhook = async (
  req: Request,
  res: Response,
  app: AppContext
): Promise<void> => {
  const body = getBodyObject(req);

  // Authenticate via api_key query param OR authorization header
  const apiKey = req.query["api_key"] as string | undefined;
  let authHeader = req.get("authorization") ?? "";
  if (authHeader.length === 0 && apiKey !== undefined && apiKey.length > 0) {
    // Construct a Basic auth header from api_key
    // The api_key param contains email:key format or just the key
    // For Zulip compatibility, api_key is used with the bot's email
    const email = body["email"] as string | undefined ?? req.query["email"] as string | undefined ?? "";
    if (email.length > 0) {
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
  const integrationName = req.params["integration_name"] as string ?? "generic";

  const stream = body["stream"] as string | undefined ?? req.query["stream"] as string | undefined;
  const topic = body["topic"] as string | undefined ?? req.query["topic"] as string | undefined;
  const content = body["content"] as string | undefined;

  const result = await handleIncomingWebhookDomain(app.options, user, {
    integrationName,
    stream,
    topic,
    content,
    body,
  });

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const data = result.data;
  res.json({ result: "success", msg: "", id: data.id });
};
