import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateCustomProfileFieldDomain } from "@jotster/users/Jotster.Users.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import type { AppContext } from "../helpers/app-context.ts";
import {
  getBodyObject,
  getOptionalFlagIntField,
  getOptionalIntField,
  getOptionalStringField,
  hasField,
  toLong,
} from "../helpers/body.ts";

export const handleUpdateCustomProfileField = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const authResult = await authenticateRequest(
    app.options,
    req.get("authorization") ?? "",
  );
  if (!authResult.success) {
    res
      .status(401)
      .json({ result: "error", msg: authResult.error, code: "UNAUTHORIZED" });
    return;
  }

  const user = authResult.data;
  if (user.role > 200) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Must be an organization administrator",
        code: "UNAUTHORIZED_PRINCIPAL",
      });
    return;
  }
  const fieldId = parseId(req.param("field_id") ?? "");
  if (fieldId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid field_id" });
    return;
  }
  const body = getBodyObject(req);

  const updates: {
    name?: string;
    hint?: string;
    fieldType?: int;
    fieldDataJson?: string;
    displayInProfileSummary?: int;
    required?: int;
    editableByUser?: int;
    useForUserMatching?: int;
    ordering?: int;
  } = {};
  const name = getOptionalStringField(body, "name");
  if (name !== undefined) updates.name = name;
  const hint = getOptionalStringField(body, "hint");
  if (hint !== undefined) updates.hint = hint;
  if (hasField(body, "field_type")) {
    const fieldType = getOptionalIntField(body, "field_type");
    if (fieldType === undefined) {
      res.status(400).json({ result: "error", msg: "Invalid field_type" });
      return;
    }
    updates.fieldType = fieldType;
  }
  const fieldData = getOptionalStringField(body, "field_data");
  if (fieldData !== undefined) updates.fieldDataJson = fieldData;
  if (hasField(body, "display_in_profile_summary")) {
    const displayInProfileSummary = getOptionalFlagIntField(
      body,
      "display_in_profile_summary",
    );
    if (displayInProfileSummary === undefined) {
      res
        .status(400)
        .json({
          result: "error",
          msg: "display_in_profile_summary is not valid JSON",
        });
      return;
    }
    updates.displayInProfileSummary = displayInProfileSummary;
  }
  if (hasField(body, "required")) {
    const required = getOptionalFlagIntField(body, "required");
    if (required === undefined) {
      res
        .status(400)
        .json({ result: "error", msg: "required is not valid JSON" });
      return;
    }
    updates.required = required;
  }
  if (hasField(body, "editable_by_user")) {
    const editableByUser = getOptionalFlagIntField(body, "editable_by_user");
    if (editableByUser === undefined) {
      res
        .status(400)
        .json({ result: "error", msg: "editable_by_user is not valid JSON" });
      return;
    }
    updates.editableByUser = editableByUser;
  }
  if (hasField(body, "use_for_user_matching")) {
    const useForUserMatching = getOptionalFlagIntField(
      body,
      "use_for_user_matching",
    );
    if (useForUserMatching === undefined) {
      res
        .status(400)
        .json({
          result: "error",
          msg: "use_for_user_matching is not valid JSON",
        });
      return;
    }
    updates.useForUserMatching = useForUserMatching;
  }
  if (hasField(body, "order")) {
    const ordering = getOptionalIntField(body, "order");
    if (ordering === undefined) {
      res.status(400).json({ result: "error", msg: "Invalid order" });
      return;
    }
    updates.ordering = ordering;
  }

  const result = await updateCustomProfileFieldDomain(
    app.options,
    user,
    toLong(fieldId),
    updates,
  );
  if (!result.success) {
    res
      .status(400)
      .json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};
