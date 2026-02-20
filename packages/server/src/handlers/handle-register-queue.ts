import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import {
  registerQueue,
  buildInitialState,
} from "@jotster/event-queue/Jotster.EventQueue.js";
import type { RegisterParams } from "@jotster/event-queue/Jotster.EventQueue.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleRegisterQueue = async (
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

  const eventTypesRaw = req.body["event_types"] as string | undefined;
  const fetchEventTypesRaw = req.body["fetch_event_types"] as string | undefined;

  const eventTypes = eventTypesRaw ? JSON.parse(eventTypesRaw) as string[] : undefined;
  const fetchEventTypes = fetchEventTypesRaw ? JSON.parse(fetchEventTypesRaw) as string[] : undefined;

  const clientCapabilitiesRaw = req.body["client_capabilities"] as string | undefined;
  const clientCapabilities = clientCapabilitiesRaw ? JSON.parse(clientCapabilitiesRaw) : {};

  const narrowRaw = req.body["narrow"] as string | undefined;
  const narrow = narrowRaw ? JSON.parse(narrowRaw) : undefined;

  const params: RegisterParams = {
    eventTypes,
    fetchEventTypes,
    applyMarkdown: req.body["apply_markdown"] !== false,
    clientGravatar: req.body["client_gravatar"] !== false,
    slimPresence: req.body["slim_presence"] === true,
    allPublicStreams: req.body["all_public_streams"] === true,
    narrow,
    clientCapabilities,
  };

  const queueId = registerQueue(user.tenantId, user.userId, params);

  const initialState = await buildInitialState(
    app.options,
    user.tenantId,
    user.userId,
    fetchEventTypes,
    params
  );

  const response: Record<string, unknown> = {};
  response["result"] = "success";
  response["msg"] = "";
  response["queue_id"] = queueId;
  response["last_event_id"] = -1;

  const stateKeys = Object.keys(initialState);
  for (let i = 0; i < stateKeys.length; i++) {
    response[stateKeys[i]] = initialState[stateKeys[i]];
  }

  res.json(response);
};
