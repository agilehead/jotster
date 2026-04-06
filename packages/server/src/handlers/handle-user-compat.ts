import type { JsValue, long } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
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
import {
  getBodyObject,
  getOptionalBooleanField,
  getOptionalStringArrayField,
  getOptionalStringField,
  toLong,
} from "../helpers/body.ts";
import { requireAuth } from "../helpers/require-auth.ts";

const parseIdArray = (values: string[] | undefined): long[] | undefined => {
  if (values === undefined) {
    return undefined;
  }
  const result: long[] = [];
  for (let i = 0; i < values.length; i++) {
    const parsed = parseId(values[i]);
    if (parsed === undefined) {
      return undefined;
    }
    result.push(toLong(parsed));
  }
  return result;
};

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
    res
      .status(403)
      .json({
        result: "error",
        msg: "Insufficient permission",
        code: "BAD_REQUEST",
      });
    return;
  }

  const body = getBodyObject(req);
  const targetUserId = parseId(req.param("user_id") ?? "");
  if (targetUserId === undefined) {
    res
      .status(400)
      .json({ result: "error", msg: "Invalid user_id", code: "BAD_REQUEST" });
    return;
  }
  const ok = await setTargetUserStatus(
    app.options,
    requester.tenantId,
    toLong(targetUserId),
    getOptionalStringField(body, "status_text"),
    getOptionalStringField(body, "emoji_name"),
    getOptionalStringField(body, "emoji_code"),
    getOptionalStringField(body, "reaction_type"),
  );

  if (!ok) {
    res
      .status(400)
      .json({ result: "error", msg: "User not found", code: "BAD_REQUEST" });
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

  const getBotId = parseId(req.param("bot_id") ?? "");
  if (getBotId === undefined) {
    res
      .status(400)
      .json({ result: "error", msg: "Invalid bot_id", code: "BAD_REQUEST" });
    return;
  }
  const result = await getBotApiKeyForRequester(
    app.options,
    requester,
    toLong(getBotId),
  );
  if (result.error !== undefined) {
    res
      .status(400)
      .json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
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

  const regenBotId = parseId(req.param("bot_id") ?? "");
  if (regenBotId === undefined) {
    res
      .status(400)
      .json({ result: "error", msg: "Invalid bot_id", code: "BAD_REQUEST" });
    return;
  }
  const result = await regenerateBotApiKeyForRequester(
    app.options,
    requester,
    toLong(regenBotId),
  );
  if (result.error !== undefined) {
    res
      .status(400)
      .json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
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

  const directOnly =
    getOptionalBooleanField(
      req.query as Record<string, JsValue>,
      "direct_member_only",
    ) === true;
  const membershipGroupId = parseId(req.param("group_id") ?? "");
  const membershipUserId = parseId(req.param("user_id") ?? "");
  if (membershipGroupId === undefined || membershipUserId === undefined) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Invalid user group or user",
        code: "BAD_REQUEST",
      });
    return;
  }
  const result = await getUserGroupMembershipStatus(
    app.options,
    requester.tenantId,
    toLong(membershipGroupId),
    toLong(membershipUserId),
    directOnly,
  );
  if (result === undefined) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Invalid user group or user",
        code: "BAD_REQUEST",
      });
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

  const directOnly =
    getOptionalBooleanField(
      req.query as Record<string, JsValue>,
      "direct_member_only",
    ) === true;
  const membersGroupId = parseId(req.param("group_id") ?? "");
  if (membersGroupId === undefined) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Invalid user group",
        code: "BAD_REQUEST",
      });
    return;
  }
  const result = await getUserGroupMembersCompat(
    app.options,
    requester.tenantId,
    toLong(membersGroupId),
    directOnly,
  );
  if (result === undefined) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Invalid user group",
        code: "BAD_REQUEST",
      });
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

  const directOnly =
    getOptionalBooleanField(
      req.query as Record<string, JsValue>,
      "direct_subgroup_only",
    ) === true;
  const subgroupsGroupId = parseId(req.param("group_id") ?? "");
  if (subgroupsGroupId === undefined) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Invalid user group",
        code: "BAD_REQUEST",
      });
    return;
  }
  const result = await getUserGroupSubgroupsCompat(
    app.options,
    requester.tenantId,
    toLong(subgroupsGroupId),
    directOnly,
  );
  if (result === undefined) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Invalid user group",
        code: "BAD_REQUEST",
      });
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
  const add =
    parseIdArray(getOptionalStringArrayField(body, "add")) ?? ([] as long[]);
  const del =
    parseIdArray(getOptionalStringArrayField(body, "delete")) ?? ([] as long[]);
  const addSubgroups =
    parseIdArray(getOptionalStringArrayField(body, "add_subgroups")) ??
    ([] as long[]);
  const deleteSubgroups =
    parseIdArray(getOptionalStringArrayField(body, "delete_subgroups")) ??
    ([] as long[]);
  if (
    add.length === 0 &&
    del.length === 0 &&
    addSubgroups.length === 0 &&
    deleteSubgroups.length === 0
  ) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Missing add or delete",
        code: "BAD_REQUEST",
      });
    return;
  }

  const mutateGroupId = parseId(req.param("group_id") ?? "");
  if (mutateGroupId === undefined) {
    res
      .status(400)
      .json({ result: "error", msg: "Invalid group_id", code: "BAD_REQUEST" });
    return;
  }

  if (add.length > 0) {
    const addResult = await addUserGroupMembersDomain(
      app.options,
      requester,
      toLong(mutateGroupId),
      add,
    );
    if (!addResult.success) {
      res
        .status(400)
        .json({ result: "error", msg: addResult.error, code: "BAD_REQUEST" });
      return;
    }
  }
  if (del.length > 0) {
    const delResult = await removeUserGroupMembersDomain(
      app.options,
      requester,
      toLong(mutateGroupId),
      del,
    );
    if (!delResult.success) {
      res
        .status(400)
        .json({ result: "error", msg: delResult.error, code: "BAD_REQUEST" });
      return;
    }
  }
  if (addSubgroups.length > 0) {
    const addSubgroupResult = await addUserGroupSubgroupsDomain(
      app.options,
      requester,
      toLong(mutateGroupId),
      addSubgroups,
    );
    if (!addSubgroupResult.success) {
      res
        .status(400)
        .json({
          result: "error",
          msg: addSubgroupResult.error,
          code: "BAD_REQUEST",
        });
      return;
    }
  }
  if (deleteSubgroups.length > 0) {
    const deleteSubgroupResult = await removeUserGroupSubgroupsDomain(
      app.options,
      requester,
      toLong(mutateGroupId),
      deleteSubgroups,
    );
    if (!deleteSubgroupResult.success) {
      res
        .status(400)
        .json({
          result: "error",
          msg: deleteSubgroupResult.error,
          code: "BAD_REQUEST",
        });
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
  const add =
    parseIdArray(getOptionalStringArrayField(body, "add")) ?? ([] as long[]);
  const del =
    parseIdArray(getOptionalStringArrayField(body, "delete")) ?? ([] as long[]);
  if (add.length === 0 && del.length === 0) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Missing add or delete",
        code: "BAD_REQUEST",
      });
    return;
  }

  const subgroupMutateGroupId = parseId(req.param("group_id") ?? "");
  if (subgroupMutateGroupId === undefined) {
    res
      .status(400)
      .json({ result: "error", msg: "Invalid group_id", code: "BAD_REQUEST" });
    return;
  }

  if (add.length > 0) {
    const addResult = await addUserGroupSubgroupsDomain(
      app.options,
      requester,
      toLong(subgroupMutateGroupId),
      add,
    );
    if (!addResult.success) {
      res
        .status(400)
        .json({ result: "error", msg: addResult.error, code: "BAD_REQUEST" });
      return;
    }
  }
  if (del.length > 0) {
    const delResult = await removeUserGroupSubgroupsDomain(
      app.options,
      requester,
      toLong(subgroupMutateGroupId),
      del,
    );
    if (!delResult.success) {
      res
        .status(400)
        .json({ result: "error", msg: delResult.error, code: "BAD_REQUEST" });
      return;
    }
  }

  res.json({ result: "success", msg: "" });
};
