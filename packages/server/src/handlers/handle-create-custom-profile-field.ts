import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { createCustomProfileFieldDomain } from "@jotster/users/Jotster.Users.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getBodyObject, getOptionalFlagIntField, getOptionalIntField, getOptionalStringField, hasField } from "../helpers/body.ts";

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
  const body = getBodyObject(req);

  const name = getOptionalStringField(body, "name");
  const fieldType = getOptionalIntField(body, "field_type");

  if (!name || fieldType === undefined) {
    res.status(400).json({ result: "error", msg: "Missing required fields: name, field_type" });
    return;
  }

  const hint = getOptionalStringField(body, "hint");
  const fieldData = getOptionalStringField(body, "field_data");
  const displayInProfileSummary = getOptionalFlagIntField(body, "display_in_profile_summary");
  if (hasField(body, "display_in_profile_summary") && displayInProfileSummary === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid display_in_profile_summary" });
    return;
  }

  const result = await createCustomProfileFieldDomain(app.options, user, ({
    name,
    hint,
    fieldType,
    fieldDataJson: fieldData,
    displayInProfileSummary,
  }));

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "", id: result.data.Id });
};
