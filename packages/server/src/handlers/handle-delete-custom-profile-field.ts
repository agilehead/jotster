import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { deleteCustomProfileFieldDomain } from "@jotster/users/Jotster.Users.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { toLong } from "../helpers/body.ts";
import type { AppContext } from "../helpers/app-context.ts";

export const handleDeleteCustomProfileField = async (
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
  const fieldId = parseId(req.params["field_id"] as string);
  if (fieldId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid field_id" });
    return;
  }

  const result = await deleteCustomProfileFieldDomain(
    app.options,
    user,
    toLong(fieldId),
  );
  if (!result.success) {
    res
      .status(400)
      .json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};
