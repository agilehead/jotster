import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { JotsterDbContext, ok, err } from "@jotster/core/Jotster.Core.js";
import { sendMessageDomain } from "@jotster/messages/Jotster.Messages.js";

interface IncomingWebhookInput {
  integrationName: string;
  topic?: string;
  content?: string;
  stream?: string;
  body: Record<string, unknown>;
}

const getBodyString = (
  body: Record<string, unknown>,
  key: string,
): string | undefined => {
  for (const [entryKey, entryValue] of Object.entries(body)) {
    if (entryKey === key) {
      if (typeof entryValue === "string") {
        return entryValue as string;
      }
      return undefined;
    }
  }
  return undefined;
};

export const handleIncomingWebhookDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  input: IncomingWebhookInput,
): Promise<Result<{ id: long }, string>> => {
  // Verify the user is a bot of type 2 (incoming webhook bot)
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const userId0 = user.userId;
    const tenantId0 = user.tenantId;
    const botUser = await db0.Users.Where((u) => u.TenantId === tenantId0)
      .Where((u) => u.Id === userId0)
      .FirstOrDefaultAsync();

    if (botUser === undefined || botUser === null) {
      return err("User not found");
    }

    const one = 1 as int;
    if (botUser.IsBot !== one) {
      return err("Only bot users can use incoming webhooks");
    }

    const botType2 = 2 as int;
    if (botUser.BotType !== botType2) {
      return err("Only incoming webhook bots (type 2) can use this endpoint");
    }
  } finally {
    db.Dispose();
  }

  // Parse payload based on integration name
  let topic = "";
  let content = "";
  let stream = "";

  if (
    input.integrationName === "generic" ||
    input.integrationName === undefined
  ) {
    // Generic format: read topic + content from body or params
    topic = (input.topic ?? getBodyString(input.body, "topic") ?? "").trim();
    content = (
      input.content ??
      getBodyString(input.body, "content") ??
      ""
    ).trim();
    stream = (input.stream ?? getBodyString(input.body, "stream") ?? "").trim();
  } else {
    // For other integrations, fall back to generic format for MVP
    topic = (
      input.topic ??
      getBodyString(input.body, "topic") ??
      input.integrationName
    ).trim();
    content = (
      input.content ??
      getBodyString(input.body, "content") ??
      ""
    ).trim();
    stream = (input.stream ?? getBodyString(input.body, "stream") ?? "").trim();

    // If content is still empty, try to extract a reasonable default
    if (content.length === 0) {
      const text = getBodyString(input.body, "text");
      if (text !== undefined) {
        content = text.trim();
      }
    }
  }

  if (content.length === 0) {
    return err("Message content must not be empty");
  }

  if (stream.length === 0) {
    return err("Stream/channel must be specified");
  }

  if (topic.length === 0) {
    topic = "(no topic)";
  }

  // Send the message as the bot user to the specified channel/topic
  const result = await sendMessageDomain(options, user, {
    type: "stream",
    to: stream,
    topic,
    content,
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok({ id: result.data.id });
};
