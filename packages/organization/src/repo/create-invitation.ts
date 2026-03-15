import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Invitation, generateId } from "@jotster/core/Jotster.Core.js";
import { JsonSerializer } from "@tsonic/dotnet/System.Text.Json.js";

interface CreateInvitationInput {
  tenantId: long;
  inviterId: long;
  email: string;
  channelIds: string[];
  invitedAsRole: int;
  expiresAt?: long;
}

export const createInvitation = async (
  options: DbContextOptions,
  input: CreateInvitationInput
): Promise<Invitation> => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  const invitation = new Invitation();
  invitation.TenantId = input.tenantId;
  invitation.InviterId = input.inviterId;
  invitation.Email = input.email;
  invitation.IsMultiuse = 0 as int;
  invitation.LinkToken = generateId();
  invitation.ChannelIdsJson = JsonSerializer.Serialize(input.channelIds);
  invitation.InvitedAsRole = input.invitedAsRole;
  invitation.Status = "pending";
  invitation.CreatedAt = now;
  invitation.ExpiresAt = input.expiresAt;

  const db = new JotsterDbContext(options);
  try {
    db.Invitations.Add(invitation);
    await db.SaveChangesAsync();
    return invitation;
  } finally {
    db.Dispose();
  }
};
