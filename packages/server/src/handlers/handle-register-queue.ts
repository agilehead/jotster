import type { JsValue } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import {
  getBodyObject,
  getOptionalBooleanField,
  getOptionalFlagIntField,
  getOptionalJsonObjectField,
  getOptionalStringField,
  parseJsonValueText,
  toOptionalStringArray,
} from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { registerQueue } from "@jotster/event-queue/Jotster.EventQueue.js";
import { buildInitialState } from "../helpers/build-initial-state.ts";
import type { RegisterParams } from "@jotster/event-queue/Jotster.EventQueue.js";
import type { AppContext } from "../helpers/app-context.ts";

const normalizeClientCapabilities = (
  value: Record<string, JsValue> | undefined,
): RegisterParams["clientCapabilities"] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const normalized: RegisterParams["clientCapabilities"] = {};

  if (getOptionalBooleanField(value, "notification_settings_null") === true) {
    normalized.notificationSettingsNull = true;
  }
  if (getOptionalBooleanField(value, "bulk_message_deletion") === true) {
    normalized.bulkMessageDeletion = true;
  }
  if (
    getOptionalBooleanField(value, "user_avatar_url_field_optional") === true
  ) {
    normalized.userAvatarUrlFieldOptional = true;
  }
  if (getOptionalBooleanField(value, "stream_typing_notifications") === true) {
    normalized.streamTypingNotifications = true;
  }
  if (getOptionalBooleanField(value, "user_settings_object") === true) {
    normalized.userSettingsObject = true;
  }
  if (getOptionalBooleanField(value, "linkifier_url_template") === true) {
    normalized.linkifierUrlTemplate = true;
  }
  if (getOptionalBooleanField(value, "group_setting_value") === true) {
    normalized.groupSettingValue = true;
  }
  if (getOptionalBooleanField(value, "archived_channels") === true) {
    normalized.archivedChannels = true;
  }
  if (getOptionalBooleanField(value, "user_list_incomplete") === true) {
    normalized.userListIncomplete = true;
  }
  if (getOptionalBooleanField(value, "include_deactivated_groups") === true) {
    normalized.includeDeactivatedGroups = true;
  }

  return normalized;
};

const normalizeRegisterNarrow = (
  value: JsValue | undefined,
): RegisterParams["narrow"] | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    return undefined;
  }

  const entries = value as JsValue[];
  const result: NonNullable<RegisterParams["narrow"]> = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return undefined;
    }

    const record = entry as Record<string, JsValue>;
    const operator = getOptionalStringField(record, "operator");
    const operand = getOptionalStringField(record, "operand");
    const negated = getOptionalBooleanField(record, "negated");

    if (operator === undefined || operand === undefined) {
      return undefined;
    }

    result.push(
      negated === undefined
        ? { operator, operand }
        : { operator, operand, negated },
    );
  }

  return result;
};

export const handleRegisterQueue = async (
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

  const eventTypesRaw = getOptionalStringField(body, "event_types");
  const fetchEventTypesRaw = getOptionalStringField(body, "fetch_event_types");

  const eventTypes = toOptionalStringArray(eventTypesRaw);
  const fetchEventTypes = toOptionalStringArray(fetchEventTypesRaw);

  const clientCapabilitiesObject = getOptionalJsonObjectField(
    body,
    "client_capabilities",
  );
  const clientCapabilities =
    clientCapabilitiesObject !== undefined
      ? normalizeClientCapabilities(clientCapabilitiesObject)
      : undefined;
  const includeDeactivatedGroups =
    getOptionalBooleanField(
      clientCapabilitiesObject ?? {},
      "include_deactivated_groups",
    ) === true;

  const narrowRaw = getOptionalStringField(body, "narrow");
  const narrow = normalizeRegisterNarrow(
    narrowRaw ? parseJsonValueText(narrowRaw) : undefined,
  );
  const applyMarkdown = getOptionalFlagIntField(body, "apply_markdown");
  const clientGravatar = getOptionalFlagIntField(body, "client_gravatar");
  const slimPresence = getOptionalFlagIntField(body, "slim_presence");
  const allPublicStreams = getOptionalFlagIntField(body, "all_public_streams");

  const params: RegisterParams = {
    eventTypes,
    fetchEventTypes,
    applyMarkdown: applyMarkdown === undefined ? true : applyMarkdown === 1,
    clientGravatar: clientGravatar === undefined ? true : clientGravatar === 1,
    slimPresence: slimPresence === 1,
    allPublicStreams: allPublicStreams === 1,
    narrow,
    clientCapabilities,
  };

  const queueId = registerQueue(user.tenantId, user.userId, params);

  const initialState = await buildInitialState(
    app.options,
    user.tenantId,
    user.userId,
    fetchEventTypes,
    params,
    includeDeactivatedGroups,
  );

  const response: Record<string, JsValue> = {};
  response["result"] = "success";
  response["msg"] = "";
  response["queue_id"] = queueId;
  response["last_event_id"] = -1;

  const state = initialState as Record<string, JsValue>;
  for (const key in state) {
    response[key] = state[key];
  }

  res.json(response);
};
