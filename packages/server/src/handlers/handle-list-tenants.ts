import type { Request, Response } from "@tsonic/express/index.js";
import { listTenantsAdmin } from "@jotster/auth/Jotster.Auth.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleListTenants = async (
  req: Request,
  res: Response,
  app: AppContext
): Promise<void> => {
  const authHeader = req.get("authorization") ?? "";
  const rootToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : "";

  const result = await listTenantsAdmin(app.options, app.config, rootToken);
  if (!result.success) {
    const status = result.error === "Unauthorized" ? 401 : 400;
    res.status(status).json({ result: "error", msg: result.error });
    return;
  }

  const data = result.data;
  const tenants = new List<Record<string, unknown>>();
  for (let i = 0; i < data.length; i++) {
    const t = data[i];
    tenants.Add({
      id: t.Id,
      subdomain: t.Subdomain,
      name: t.Name,
      description: t.Description,
      active: t.Active,
      created_at: t.CreatedAt,
    });
  }

  res.json({ tenants: tenants.ToArray() });
};
