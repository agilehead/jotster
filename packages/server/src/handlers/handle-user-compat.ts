import type { Request, Response } from "@tsonic/express/index.js";
import {
  addUserGroupMembersDomain,
  addUserGroupSubgroupsDomain,
  removeUserGroupMembersDomain,
  removeUserGroupSubgroupsDomain,
} from "@jotster/permissions/Jotster.Permissions.js";
import type { AppContext } from "../helpers/app-context.ts";
import {
  getUserGroupMembersCompat,
  getBotApiKeyForRequester,
  regenerateBotApiKeyForRequester,
  getUserGroupMembershipStatus,
  getUserGroupSubgroupsCompat,
  setTargetUserStatus,
} from "../helpers/compat-db.ts";
import { getBodyObject, getOptionalBooleanField, getOptionalStringArrayField, getOptionalStringField } from "../helpers/body.ts";
import { requireAuth } from "../helpers/require-auth.ts";

export const handleSetTargetUserStatusCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }
  if (requester.role > 200) {
    res.status(403).json({ result: "error", msg: "Insufficient permission", code: "BAD_REQUEST" });
    return;
  }

  const body = getBodyObject(req);
  const ok = await setTargetUserStatus(
    app.options,
    requester.tenantId,
    req.params["user_id"] as string,
    getOptionalStringField(body, "status_text"),
    getOptionalStringField(body, "emoji_name"),
    getOptionalStringField(body, "emoji_code"),
    getOptionalStringField(body, "reaction_type"),
  );

  if (!ok) {
    res.status(400).json({ result: "error", msg: "User not found", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};

export const handleGetBotApiKeyCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const result = await getBotApiKeyForRequester(app.options, requester, req.params["bot_id"] as string);
  if (result.error !== undefined) {
    res.status(400).json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "", api_key: result.apiKey });
};

export const handleRegenerateBotApiKeyCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const result = await regenerateBotApiKeyForRequester(app.options, requester, req.params["bot_id"] as string);
  if (result.error !== undefined) {
    res.status(400).json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "", api_key: result.apiKey });
};

export const handleGetUserGroupMembershipCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const directOnly = getOptionalBooleanField(req.query as Record<string, unknown>, "direct_member_only") === true;
  const result = await getUserGroupMembershipStatus(
    app.options,
    requester.tenantId,
    req.params["group_id"] as string,
    req.params["user_id"] as string,
    directOnly,
  );
  if (result === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid user group or user", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "", is_user_group_member: result });
};

export const handleGetUserGroupMembersCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const directOnly = getOptionalBooleanField(req.query as Record<string, unknown>, "direct_member_only") === true;
  const result = await getUserGroupMembersCompat(
    app.options,
    requester.tenantId,
    req.params["group_id"] as string,
    directOnly,
  );
  if (result === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid user group", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "", members: result });
};

export const handleGetUserGroupSubgroupsCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const directOnly = getOptionalBooleanField(req.query as Record<string, unknown>, "direct_subgroup_only") === true;
  const result = await getUserGroupSubgroupsCompat(
    app.options,
    requester.tenantId,
    req.params["group_id"] as string,
    directOnly,
  );
  if (result === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid user group", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "", subgroups: result });
};

export const handleMutateUserGroupMembersCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const add = getOptionalStringArrayField(body, "add") ?? [];
  const del = getOptionalStringArrayField(body, "delete") ?? [];
  const addSubgroups = getOptionalStringArrayField(body, "add_subgroups") ?? [];
  const deleteSubgroups = getOptionalStringArrayField(body, "delete_subgroups") ?? [];
  if (add.length === 0 && del.length === 0 && addSubgroups.length === 0 && deleteSubgroups.length === 0) {
    res.status(400).json({ result: "error", msg: "Missing add or delete", code: "BAD_REQUEST" });
    return;
  }

  if (add.length > 0) {
    const addResult = await addUserGroupMembersDomain(app.options, requester, req.params["group_id"] as string, add);
    if (!addResult.success) {
      res.status(400).json({ result: "error", msg: addResult.error, code: "BAD_REQUEST" });
      return;
    }
  }
  if (del.length > 0) {
    const delResult = await removeUserGroupMembersDomain(app.options, requester, req.params["group_id"] as string, del);
    if (!delResult.success) {
      res.status(400).json({ result: "error", msg: delResult.error, code: "BAD_REQUEST" });
      return;
    }
  }
  if (addSubgroups.length > 0) {
    const addSubgroupResult = await addUserGroupSubgroupsDomain(
      app.options,
      requester,
      req.params["group_id"] as string,
      addSubgroups,
    );
    if (!addSubgroupResult.success) {
      res.status(400).json({ result: "error", msg: addSubgroupResult.error, code: "BAD_REQUEST" });
      return;
    }
  }
  if (deleteSubgroups.length > 0) {
    const deleteSubgroupResult = await removeUserGroupSubgroupsDomain(
      app.options,
      requester,
      req.params["group_id"] as string,
      deleteSubgroups,
    );
    if (!deleteSubgroupResult.success) {
      res.status(400).json({ result: "error", msg: deleteSubgroupResult.error, code: "BAD_REQUEST" });
      return;
    }
  }

  res.json({ result: "success", msg: "" });
};

export const handleMutateUserGroupSubgroupsCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const add = getOptionalStringArrayField(body, "add") ?? [];
  const del = getOptionalStringArrayField(body, "delete") ?? [];
  if (add.length === 0 && del.length === 0) {
    res.status(400).json({ result: "error", msg: "Missing add or delete", code: "BAD_REQUEST" });
    return;
  }

  if (add.length > 0) {
    const addResult = await addUserGroupSubgroupsDomain(app.options, requester, req.params["group_id"] as string, add);
    if (!addResult.success) {
      res.status(400).json({ result: "error", msg: addResult.error, code: "BAD_REQUEST" });
      return;
    }
  }
  if (del.length > 0) {
    const delResult = await removeUserGroupSubgroupsDomain(app.options, requester, req.params["group_id"] as string, del);
    if (!delResult.success) {
      res.status(400).json({ result: "error", msg: delResult.error, code: "BAD_REQUEST" });
      return;
    }
  }

  res.json({ result: "success", msg: "" });
};
