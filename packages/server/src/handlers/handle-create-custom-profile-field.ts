import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { createCustomProfileFieldDomain } from "@jotster/users/Jotster.Users.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleCreateCustomProfileField = async (
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

  const name = body["name"] as string | undefined;
  const fieldType = body["field_type"] as int | undefined;

  if (!name || fieldType === undefined) {
    res.status(400).json({ result: "error", msg: "Missing required fields: name, field_type" });
    return;
  }

  const hint = body["hint"] as string | undefined;
  const fieldData = body["field_data"] as string | undefined;
  const displayInProfileSummary = body["display_in_profile_summary"] as int | undefined;

  const result = await createCustomProfileFieldDomain(app.options, user, {
    name,
    hint,
    fieldType,
    fieldDataJson: fieldData,
    displayInProfileSummary,
  });

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "", id: result.data.Id });
};
