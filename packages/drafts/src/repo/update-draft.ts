import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Draft } from "@jotster/core/Jotster.Core.js";

interface UpdateDraftInput {
  type?: string;
  channelId?: string;
  topic?: string;
  recipientIdsJson?: string;
  content?: string;
}

export const updateDraft = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string,
  draftId: string,
  updates: UpdateDraftInput
): Promise<Draft | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const draftId0 = draftId;
    const draft = await db0.Drafts
      .Where((d) => d.TenantId === tenantId0).Where((d) => d.UserId === userId0).Where((d) => d.Id === draftId0)
      .FirstOrDefaultAsync();

    if (draft === undefined || draft === null) {
      return undefined;
    }

    if (updates.type !== undefined) {
      draft.Type = updates.type;
    }
    if (updates.channelId !== undefined) {
      draft.ChannelId = updates.channelId;
    }
    if (updates.topic !== undefined) {
      draft.Topic = updates.topic;
    }
    if (updates.recipientIdsJson !== undefined) {
      draft.RecipientIdsJson = updates.recipientIdsJson;
    }
    if (updates.content !== undefined) {
      draft.Content = updates.content;
    }

    draft.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
    await db0.SaveChangesAsync();
    return draft;
  } finally {
    db.Dispose();
  }
};
