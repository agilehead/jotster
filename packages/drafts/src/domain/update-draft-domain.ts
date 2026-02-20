import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToUser } from "@jotster/event-queue/Jotster.EventQueue.js";
import { updateDraft } from "../repo/update-draft.ts";

interface UpdateDraftDomainInput {
  type?: string;
  to?: string;
  topic?: string;
  content?: string;
}

export const updateDraftDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  draftId: string,
  params: UpdateDraftDomainInput
): Promise<Result<void, string>> => {
  if (params.type !== undefined && params.type !== "stream" && params.type !== "private") {
    return err("Invalid draft type: " + params.type);
  }

  const channelId = params.type === "stream" && params.to !== undefined ? params.to : undefined;
  const recipientIdsJson = params.type === "private" && params.to !== undefined ? params.to : undefined;

  const draft = await updateDraft(options, user.tenantId, user.userId, draftId, {
    type: params.type,
    channelId,
    topic: params.topic,
    recipientIdsJson,
    content: params.content,
  });

  if (draft === undefined) {
    return err("Draft not found");
  }

  const formatted: Record<string, unknown> = {};
  formatted["id"] = draft.Id;
  formatted["type"] = draft.Type;
  formatted["to"] = draft.Type === "stream" ? (draft.ChannelId ?? "") : (draft.RecipientIdsJson ?? "[]");
  formatted["topic"] = draft.Topic ?? "";
  formatted["content"] = draft.Content;
  formatted["timestamp"] = Number(draft.UpdatedAt) / 1000;

  dispatchEventToUser(user.tenantId, user.userId, {
    type: "drafts",
    op: "update",
    data: formatted,
  });

  return ok(undefined);
};
