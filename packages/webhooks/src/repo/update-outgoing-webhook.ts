import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, OutgoingWebhook } from "@jotster/core/Jotster.Core.js";

interface UpdateOutgoingWebhookInput {
  url?: string;
  token?: string;
  triggerType?: string;
  channelIdsJson?: string;
  interfaceType?: int;
}

export const updateOutgoingWebhook = async (
  options: DbContextOptions,
  tenantId: string,
  botUserId: string,
  input: UpdateOutgoingWebhookInput
): Promise<OutgoingWebhook | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const botUserId0 = botUserId;
    const webhook = await db0.OutgoingWebhooks
      .Where((w) => w.TenantId === tenantId0).Where((w) => w.BotUserId === botUserId0)
      .FirstOrDefaultAsync();

    if (webhook === undefined || webhook === null) {
      return undefined;
    }

    if (input.url !== undefined) {
      webhook.Url = input.url;
    }
    if (input.token !== undefined) {
      webhook.Token = input.token;
    }
    if (input.triggerType !== undefined) {
      webhook.TriggerType = input.triggerType;
    }
    if (input.channelIdsJson !== undefined) {
      webhook.ChannelIdsJson = input.channelIdsJson;
    }
    if (input.interfaceType !== undefined) {
      webhook.InterfaceType = input.interfaceType;
    }

    webhook.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
    await db0.SaveChangesAsync();
    return webhook;
  } finally {
    db.Dispose();
  }
};
