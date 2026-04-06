import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { createMultiuseInvitation } from "../repo/create-multiuse-invitation.ts";

type CreateMultiuseLinkInput = {
  channelIds: string[];
  inviteAsRole: int;
};

export const createMultiuseLinkDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  input: CreateMultiuseLinkInput,
): Promise<Result<{ link: string }, string>> => {
  // Check permission - admin or member with invite policy
  if (user.role > 400) {
    return err("Insufficient permission");
  }

  const invitation = await createMultiuseInvitation(options, {
    tenantId: user.tenantId,
    inviterId: user.userId,
    channelIds: input.channelIds,
    invitedAsRole: input.inviteAsRole,
  });

  // Emit invites_changed event
  dispatchEventToTenant(user.tenantId, {
    type: "invites_changed",
    data: {},
  });

  const link = "/join/" + invitation.LinkToken;
  return ok({ link });
};
