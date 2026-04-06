import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { createUserDomain } from "@jotster/users/Jotster.Users.js";
import type { CreateUserDomainInput } from "@jotster/users/Jotster.Users.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleCreateUser = async (
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
  const body = getBodyObject(req);
  const email = body["email"] as string | undefined;
  const password = body["password"] as string | undefined;
  const fullName = body["full_name"] as string | undefined;

  if (!email || !password || !fullName) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Missing required fields: email, password, full_name",
      });
    return;
  }

  const input: CreateUserDomainInput = { email, password, fullName };
  const result = await createUserDomain(app.options, user, input);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "", user_id: result.data.Id });
};
