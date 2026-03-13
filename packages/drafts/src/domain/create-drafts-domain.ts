import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { Convert } from "@tsonic/dotnet/System.js";
import { dispatchEventToUser } from "@jotster/event-queue/Jotster.EventQueue.js";
import { createDraft } from "../repo/create-draft.ts";

interface CreateDraftApiInput {
  type: string;
  to: string;
  topic?: string;
  content: string;
}

export const createDraftsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  drafts: CreateDraftApiInput[]
): Promise<Result<string[], string>> => {
  if (drafts.length === 0) {
    return err("No drafts provided");
  }

  const ids = new List<string>();

  for (let i = 0; i < drafts.length; i++) {
    const input = drafts[i];

    if (input.type !== "stream" && input.type !== "private") {
      return err("Invalid draft type: " + input.type);
    }

    const channelId = input.type === "stream" ? input.to : undefined;
    const recipientIdsJson = input.type === "private" ? input.to : undefined;
    const topic = input.topic;

    const draft = await createDraft(options, {
      tenantId: user.tenantId,
      userId: user.userId,
      type: input.type,
      channelId,
      topic,
      recipientIdsJson,
      content: input.content,
    });

    ids.Add(draft.Id);

    const formatted: Record<string, unknown> = {};
    formatted["id"] = draft.Id;
    formatted["type"] = draft.Type;
    formatted["to"] = draft.Type === "stream" ? (draft.ChannelId ?? "") : (draft.RecipientIdsJson ?? "[]");
    formatted["topic"] = draft.Topic ?? "";
    formatted["content"] = draft.Content;
    formatted["timestamp"] = Convert.ToDouble(draft.UpdatedAt) / 1000;

    dispatchEventToUser(user.tenantId, user.userId, {
      type: "drafts",
      op: "add",
      data: formatted,
    });
  }

  return ok(ids.ToArray());
};
