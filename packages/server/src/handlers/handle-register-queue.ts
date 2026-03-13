import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { registerQueue } from "@jotster/event-queue/Jotster.EventQueue.js";
import { buildInitialState } from "../helpers/build-initial-state.ts";
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
  const body = getBodyObject(req);

  const eventTypesRaw = body["event_types"] as string | undefined;
  const fetchEventTypesRaw = body["fetch_event_types"] as string | undefined;

  const eventTypes = eventTypesRaw ? JSON.parse(eventTypesRaw) as string[] : undefined;
  const fetchEventTypes = fetchEventTypesRaw ? JSON.parse(fetchEventTypesRaw) as string[] : undefined;

  const clientCapabilitiesRaw = body["client_capabilities"] as string | undefined;
  const clientCapabilities = clientCapabilitiesRaw
    ? (JSON.parse(clientCapabilitiesRaw) as RegisterParams["clientCapabilities"])
    : undefined;

  const narrowRaw = body["narrow"] as string | undefined;
  const narrow = narrowRaw ? (JSON.parse(narrowRaw) as RegisterParams["narrow"]) : undefined;

  const params: RegisterParams = {
    eventTypes,
    fetchEventTypes,
    applyMarkdown: body["apply_markdown"] !== false,
    clientGravatar: body["client_gravatar"] !== false,
    slimPresence: body["slim_presence"] === true,
    allPublicStreams: body["all_public_streams"] === true,
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

  const state = initialState as Record<string, unknown>;
  for (const key in state) {
    response[key] = state[key];
  }

  res.json(response);
};
