import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, OutgoingWebhook, generateId } from "@jotster/core/Jotster.Core.js";

interface CreateOutgoingWebhookInput {
  tenantId: string;
  botUserId: string;
  url: string;
  token: string;
  triggerType: string;
  channelIdsJson?: string;
  interfaceType: int;
}

export const createOutgoingWebhook = async (
  options: DbContextOptions,
  input: CreateOutgoingWebhookInput
): Promise<OutgoingWebhook> => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  const webhook = new OutgoingWebhook();
  webhook.Id = generateId();
  webhook.TenantId = input.tenantId;
  webhook.BotUserId = input.botUserId;
  webhook.Url = input.url;
  webhook.Token = input.token;
  webhook.TriggerType = input.triggerType;
  webhook.ChannelIdsJson = input.channelIdsJson;
  webhook.InterfaceType = input.interfaceType;
  webhook.CreatedAt = now;
  webhook.UpdatedAt = now;

  const db = new JotsterDbContext(options);
  try {
    db.OutgoingWebhooks.Add(webhook);
    await db.SaveChangesAsync();
    return webhook;
  } finally {
    db.Dispose();
  }
};
