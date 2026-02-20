import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getRealmDomains } from "@jotster/organization/Jotster.Organization.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetRealmDomains = async (
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
  const domains = await getRealmDomains(app.options, user.tenantId);

  const result = new List<Record<string, unknown>>();
  for (let i = 0; i < domains.Length; i++) {
    const d = domains[i];
    const obj: Record<string, unknown> = {};
    obj["domain"] = d.Domain;
    obj["allow_subdomains"] = d.AllowSubdomains === (1 as int);
    result.Add(obj);
  }

  res.json({ result: "success", msg: "", realm_domains: result.ToArray() });
};
