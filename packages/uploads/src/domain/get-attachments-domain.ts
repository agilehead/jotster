import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { Convert } from "@tsonic/dotnet/System.js";
import { getUserAttachments } from "../repo/get-user-attachments.ts";
import { getAttachmentMessages } from "../repo/get-attachment-messages.ts";

interface AttachmentInfo {
  id: string;
  name: string;
  path_id: string;
  size: number;
  create_time: number;
  messages: { id: string }[];
}

export const getAttachmentsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser
): Promise<Result<{ attachments: AttachmentInfo[] }, string>> => {
  const attachments = await getUserAttachments(options, user.tenantId, user.userId);

  const result = new List<AttachmentInfo>();
  for (let i = 0; i < attachments.length; i++) {
    const a = attachments[i];
    const links = await getAttachmentMessages(options, a.Id);
    const messages = new List<{ id: string }>();
    for (let j = 0; j < links.length; j++) {
      messages.Add({ id: links[j].MessageId });
    }
    result.Add({
      id: a.Id,
      name: a.FileName,
      path_id: a.PathId,
      size: a.Size,
      create_time: Convert.ToDouble(a.CreatedAt) / 1000,
      messages: messages.ToArray(),
    });
  }

  return ok({ attachments: result.ToArray() });
};
