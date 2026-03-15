import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { createCustomProfileFieldDomain } from "@jotster/users/Jotster.Users.js";
import type { AppContext } from "../helpers/app-context.ts";
import {
  getBodyObject,
  getOptionalFlagIntField,
  getOptionalIntField,
  getOptionalStringField,
  hasField,
} from "../helpers/body.ts";

export const handleCreateCustomProfileField = async (
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
  const body = getBodyObject(req);

  const name = getOptionalStringField(body, "name");
  const fieldType = getOptionalIntField(body, "field_type");

  if (name === undefined || fieldType === undefined) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Missing required fields: name, field_type",
      });
    return;
  }

  const hint = getOptionalStringField(body, "hint");
  const fieldData = getOptionalStringField(body, "field_data");
  const displayInProfileSummary = getOptionalFlagIntField(
    body,
    "display_in_profile_summary",
  );
  if (
    hasField(body, "display_in_profile_summary") &&
    displayInProfileSummary === undefined
  ) {
    res
      .status(400)
      .json({ result: "error", msg: "Invalid display_in_profile_summary" });
    return;
  }
  const required = getOptionalFlagIntField(body, "required");
  if (hasField(body, "required") && required === undefined) {
    res
      .status(400)
      .json({ result: "error", msg: "required is not valid JSON" });
    return;
  }
  const editableByUser = getOptionalFlagIntField(body, "editable_by_user");
  if (hasField(body, "editable_by_user") && editableByUser === undefined) {
    res
      .status(400)
      .json({ result: "error", msg: "editable_by_user is not valid JSON" });
    return;
  }
  const useForUserMatching = getOptionalFlagIntField(
    body,
    "use_for_user_matching",
  );
  if (
    hasField(body, "use_for_user_matching") &&
    useForUserMatching === undefined
  ) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "use_for_user_matching is not valid JSON",
      });
    return;
  }

  const result = await createCustomProfileFieldDomain(app.options, user, {
    name,
    hint,
    fieldType,
    fieldDataJson: fieldData,
    displayInProfileSummary,
    required,
    editableByUser,
    useForUserMatching,
  });

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "", id: result.data.Id });
};
