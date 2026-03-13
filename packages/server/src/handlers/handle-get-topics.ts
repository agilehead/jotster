import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getTopicsDomain } from "@jotster/channels/Jotster.Channels.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetTopics = async (
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
  const streamId = req.params["stream_id"] as string;

  const result = await getTopicsDomain(app.options, user, streamId);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const topics = new List<Record<string, unknown>>();
  for (let i = 0; i < result.data.length; i++) {
    const t = result.data[i];
    const topic: Record<string, unknown> = {};
    topic["name"] = t.name;
    topic["max_id"] = t.maxId;
    topics.Add(topic);
  }

  res.json({ topics: topics.ToArray() });
};
