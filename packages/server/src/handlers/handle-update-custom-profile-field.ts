import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateCustomProfileFieldDomain } from "@jotster/users/Jotster.Users.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getBodyObject, getOptionalFlagIntField, getOptionalIntField } from "../helpers/body.ts";

export const handleUpdateCustomProfileField = async (
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
  const fieldId = req.params["field_id"] as string;
  const body = getBodyObject(req);

  const updates: { name?: string; hint?: string; fieldType?: int; fieldDataJson?: string; displayInProfileSummary?: int; ordering?: int } = {};
  if (body["name"] !== undefined) updates.name = body["name"] as string;
  if (body["hint"] !== undefined) updates.hint = body["hint"] as string;
  if (body["field_type"] !== undefined) {
    const fieldType = getOptionalIntField(body, "field_type");
    if (fieldType === undefined) {
      res.status(400).json({ result: "error", msg: "Invalid field_type" });
      return;
    }
    updates.fieldType = fieldType;
  }
  if (body["field_data"] !== undefined) updates.fieldDataJson = body["field_data"] as string;
  if (body["display_in_profile_summary"] !== undefined) {
    const displayInProfileSummary = getOptionalFlagIntField(body, "display_in_profile_summary");
    if (displayInProfileSummary === undefined) {
      res.status(400).json({ result: "error", msg: "Invalid display_in_profile_summary" });
      return;
    }
    updates.displayInProfileSummary = displayInProfileSummary;
  }
  if (body["order"] !== undefined) {
    const ordering = getOptionalIntField(body, "order");
    if (ordering === undefined) {
      res.status(400).json({ result: "error", msg: "Invalid order" });
      return;
    }
    updates.ordering = ordering;
  }

  const result = await updateCustomProfileFieldDomain(app.options, user, fieldId, updates);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
