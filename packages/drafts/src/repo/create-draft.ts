import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Draft, generateId } from "@jotster/core/Jotster.Core.js";

interface CreateDraftInput {
  tenantId: string;
  userId: string;
  type: string;
  channelId?: string;
  topic?: string;
  recipientIdsJson?: string;
  content: string;
}

export const createDraft = async (
  options: DbContextOptions,
  input: CreateDraftInput
): Promise<Draft> => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  const draft = new Draft();
  draft.Id = generateId();
  draft.TenantId = input.tenantId;
  draft.UserId = input.userId;
  draft.Type = input.type;
  draft.ChannelId = input.channelId;
  draft.Topic = input.topic;
  draft.RecipientIdsJson = input.recipientIdsJson;
  draft.Content = input.content;
  draft.UpdatedAt = now;
  draft.CreatedAt = now;

  const db = new JotsterDbContext(options);
  try {
    db.Drafts.Add(draft);
    await db.SaveChangesAsync();
    return draft;
  } finally {
    db.Dispose();
  }
};
