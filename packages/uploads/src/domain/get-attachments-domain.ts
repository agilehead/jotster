import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { Convert } from "@tsonic/dotnet/System.js";
import { getUserAttachments } from "../repo/get-user-attachments.ts";
import { getAttachmentMessages } from "../repo/get-attachment-messages.ts";

export class AttachmentMessageInfo {
  id!: string;
}

export class AttachmentInfo {
  id!: string;
  name!: string;
  path_id!: string;
  size!: number;
  create_time!: number;
  messages!: AttachmentMessageInfo[];
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
    const messages = new List<AttachmentMessageInfo>();
    for (let j = 0; j < links.length; j++) {
      const message = new AttachmentMessageInfo();
      message.id = links[j].MessageId;
      messages.Add(message);
    }
    const item = new AttachmentInfo();
    item.id = a.Id;
    item.name = a.FileName;
    item.path_id = a.PathId;
    item.size = a.Size;
    item.create_time = Convert.ToDouble(a.CreatedAt) / 1000;
    item.messages = messages.ToArray();
    result.Add(item);
  }

  return ok({ attachments: result.ToArray() });
};
