import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { addRealmDomainDomain } from "@jotster/organization/Jotster.Organization.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleAddRealmDomain = async (
  req: Request,
  res: Response,
  app: AppContext
): Promise<void> => {
  const authResult = await authenticateRequest(app.options, req.get("authorization") ?? "");
  if (!authResult.success) {
    res.status(401).json({ result: "error", msg: authResult.error, code: "UNAUTHORIZED" });
    return;
  }

  const user = authResult.data;
  const body = req.body as Record<string, unknown>;

  const domain = body["domain"] as string;
  if (!domain) {
    res.status(400).json({ result: "error", msg: "Missing domain" });
    return;
  }

  const allowSubdomains = body["allow_subdomains"] === true;

  const result = await addRealmDomainDomain(app.options, user, domain, allowSubdomains);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "", new_domain: { domain: result.data.Domain, allow_subdomains: allowSubdomains } });
};
