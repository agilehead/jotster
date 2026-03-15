import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { Int64 } from "@tsonic/dotnet/System.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { dispatchEventToUser } from "@jotster/event-queue/Jotster.EventQueue.js";
import { createDraft } from "../repo/create-draft.ts";
import { mapDraftToCompatRecord } from "./map-draft-to-compat-record.ts";

interface CreateDraftApiInput {
  type: string;
  to: string;
  topic?: string;
  content: string;
}

export const createDraftsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  drafts: CreateDraftApiInput[],
): Promise<Result<long[], string>> => {
  if (drafts.length === 0) {
    return err("No drafts provided");
  }

  const ids = new List<long>();

  for (let i = 0; i < drafts.length; i++) {
    const input = drafts[i];

    if (input.type !== "stream" && input.type !== "private") {
      return err("Invalid draft type: " + input.type);
    }

    const channelId =
      input.type === "stream" ? (Int64.Parse(input.to) as long) : undefined;
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

    const draftRecords: Record<string, unknown>[] = [
      mapDraftToCompatRecord(draft),
    ];

    dispatchEventToUser(user.tenantId, user.userId, {
      type: "drafts",
      op: "add",
      data: {
        drafts: draftRecords,
      },
    });
  }

  return ok(ids.ToArray());
};
