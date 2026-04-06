import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getUserByEmail } from "@jotster/users/Jotster.Users.js";
import { createInvitation } from "../repo/create-invitation.ts";
import { getInvitations } from "../repo/get-invitations.ts";

type SendInvitationsInput = {
  inviteeEmails: string[];
  channelIds: string[];
  inviteAsRole: int;
};

export const sendInvitationsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  input: SendInvitationsInput,
): Promise<Result<boolean, string>> => {
  // Check permission - admin or member with invite policy
  if (user.role > 400) {
    return err("Insufficient permission");
  }

  if (input.inviteeEmails.length === 0) {
    return err("No email addresses provided");
  }

  // Check no existing users match
  for (let i = 0; i < input.inviteeEmails.length; i++) {
    const email = input.inviteeEmails[i].trim().toLowerCase();
    if (email.length === 0) {
      return err("Email address cannot be empty");
    }

    const existingUser = await getUserByEmail(options, user.tenantId, email);
    if (existingUser !== undefined) {
      return err("User with email " + email + " already exists");
    }
  }

  // Check no pending invites for these emails
  const pendingInvitations = await getInvitations(options, user.tenantId);
  for (let i = 0; i < input.inviteeEmails.length; i++) {
    const email = input.inviteeEmails[i].trim().toLowerCase();
    for (let j = 0; j < pendingInvitations.length; j++) {
      if (
        pendingInvitations[j].Email !== undefined &&
        pendingInvitations[j].Email!.toLowerCase() === email
      ) {
        return err("An invitation has already been sent to " + email);
      }
    }
  }

  // Create invitation for each email
  for (let i = 0; i < input.inviteeEmails.length; i++) {
    const email = input.inviteeEmails[i].trim().toLowerCase();
    await createInvitation(options, {
      tenantId: user.tenantId,
      inviterId: user.userId,
      email,
      channelIds: input.channelIds,
      invitedAsRole: input.inviteAsRole,
    });
  }

  // Emit invites_changed event
  dispatchEventToTenant(user.tenantId, {
    type: "invites_changed",
    data: {},
  });

  return ok(true);
};
