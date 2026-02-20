import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToUser } from "@jotster/event-queue/Jotster.EventQueue.js";
import { deleteDraft } from "../repo/delete-draft.ts";

export const deleteDraftDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  draftId: string
): Promise<Result<void, string>> => {
  const result = await deleteDraft(options, user.tenantId, user.userId, draftId);
  if (!result) {
    return err("Draft not found");
  }

  const data: Record<string, unknown> = {};
  data["draft_id"] = draftId;

  dispatchEventToUser(user.tenantId, user.userId, {
    type: "drafts",
    op: "remove",
    data,
  });

  return ok(undefined);
};
