import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { Int64 } from "@tsonic/dotnet/System.js";
import { dispatchEventToUser } from "@jotster/event-queue/Jotster.EventQueue.js";
import { updateDraft } from "../repo/update-draft.ts";
import { mapDraftToCompatRecord } from "./map-draft-to-compat-record.ts";

interface UpdateDraftDomainInput {
  type?: string;
  to?: string;
  topic?: string;
  content?: string;
}

export const updateDraftDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  draftId: long,
  params: UpdateDraftDomainInput,
): Promise<Result<void, string>> => {
  if (
    params.type !== undefined &&
    params.type !== "stream" &&
    params.type !== "private"
  ) {
    return err("Invalid draft type: " + params.type);
  }

  const channelId =
    params.type === "stream" && params.to !== undefined
      ? (Int64.Parse(params.to) as long)
      : undefined;
  const recipientIdsJson =
    params.type === "private" && params.to !== undefined
      ? params.to
      : undefined;

  const draft = await updateDraft(
    options,
    user.tenantId,
    user.userId,
    draftId,
    {
      type: params.type,
      channelId,
      topic: params.topic,
      recipientIdsJson,
      content: params.content,
    },
  );

  if (draft === undefined) {
    return err("Draft not found");
  }

  dispatchEventToUser(user.tenantId, user.userId, {
    type: "drafts",
    op: "update",
    data: {
      draft: mapDraftToCompatRecord(draft),
    },
  });

  return ok(undefined);
};
