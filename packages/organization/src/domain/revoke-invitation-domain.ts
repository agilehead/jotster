import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getInvitationById } from "../repo/get-invitation-by-id.ts";
import { revokeInvitation } from "../repo/revoke-invitation.ts";

export const revokeInvitationDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  invitationId: long,
): Promise<Result<boolean, string>> => {
  // Look up invitation
  const invitation = await getInvitationById(
    options,
    user.tenantId,
    invitationId,
  );
  if (invitation === undefined) {
    return err("Invitation not found");
  }

  // Validate user is inviter or admin
  if (user.role > 200 && invitation.InviterId !== user.userId) {
    return err("Insufficient permission");
  }

  const revoked = await revokeInvitation(options, user.tenantId, invitationId);
  if (!revoked) {
    return err("Invitation could not be revoked");
  }

  // Emit invites_changed event
  dispatchEventToTenant(user.tenantId, {
    type: "invites_changed",
    data: {},
  });

  return ok(true);
};
