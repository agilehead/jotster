import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Invitation, generateId } from "@jotster/core/Jotster.Core.js";
import { JsonSerializer } from "@tsonic/dotnet/System.Text.Json.js";

interface CreateMultiuseInvitationInput {
  tenantId: string;
  inviterId: string;
  channelIds: string[];
  invitedAsRole: int;
  expiresAt?: long;
}

export const createMultiuseInvitation = async (
  options: DbContextOptions,
  input: CreateMultiuseInvitationInput
): Promise<Invitation> => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  const invitation = new Invitation();
  invitation.Id = generateId();
  invitation.TenantId = input.tenantId;
  invitation.InviterId = input.inviterId;
  invitation.IsMultiuse = 1 as int;
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
