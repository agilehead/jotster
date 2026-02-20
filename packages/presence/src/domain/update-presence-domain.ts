import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { updatePresence } from "../repo/update-presence.ts";
import { getUserPresence } from "../repo/get-user-presence.ts";

interface UpdatePresenceParams {
  status: string;
  client: string;
  pingOnly?: boolean;
}

interface PresenceResult {
  presences: Record<string, { status: string; timestamp: long }>;
  serverTimestamp: long;
}

export const updatePresenceDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  params: UpdatePresenceParams
): Promise<Result<PresenceResult, string>> => {
  if (params.status !== "active" && params.status !== "idle") {
    return err("Invalid status: must be 'active' or 'idle'");
  }

  await updatePresence(
    options,
    user.tenantId,
    user.userId,
    params.client,
    params.status,
    params.pingOnly
  );

  // Aggregate all client presences for the user
  const allPresences = await getUserPresence(options, user.tenantId, user.userId);
  const presences: Record<string, { status: string; timestamp: long }> = {};

  for (let i = 0; i < allPresences.Length; i++) {
    const p = allPresences[i];
    presences[p.ClientName] = {
      status: p.Status,
      timestamp: p.Timestamp,
    };
  }

  const serverTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  // Dispatch presence event to tenant
  dispatchEventToTenant(user.tenantId, {
    type: "presence",
    data: {
      user_id: user.userId,
      email: user.email,
      presence: presences,
      server_timestamp: serverTimestamp,
    },
  });

  return ok({ presences, serverTimestamp });
};
