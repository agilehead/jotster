import type { ChannelFolder } from "@jotster/core/Jotster.Core.js";
import { Convert, Math as ClrMath } from "@tsonic/dotnet/System.js";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const renderDescription = (value: string): string => {
  if (value.length === 0) {
    return "";
  }
  return `<p>${escapeHtml(value)}</p>`;
};

export const mapChannelFolderToAddEventRecord = (
  folder: ChannelFolder,
): Record<string, unknown> => ({
  id: folder.Id,
  name: folder.Name,
  description: folder.Description,
  rendered_description: renderDescription(folder.Description),
  date_created: ClrMath.Floor(Convert.ToDouble(folder.CreatedAt) / 1000),
  creator_id: folder.UserId,
  is_archived: folder.IsArchived === 1,
});

export const mapChannelFolderUpdateData = (
  folder: ChannelFolder,
  updates: { name?: string; description?: string; isArchived?: number },
): Record<string, unknown> => {
  const data: Record<string, unknown> = {};
  if (updates.name !== undefined) {
    data["name"] = folder.Name;
  }
  if (updates.description !== undefined) {
    data["description"] = folder.Description;
    data["rendered_description"] = renderDescription(folder.Description);
  }
  if (updates.isArchived !== undefined) {
    data["is_archived"] = folder.IsArchived === 1;
  }
  return data;
};
