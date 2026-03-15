import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { JotsterDbContext, ok, err } from "@jotster/core/Jotster.Core.js";
import { sendMessageDomain } from "@jotster/messages/Jotster.Messages.js";

interface SlackIncomingInput {
  body: Record<string, unknown>;
  stream?: string;
  topic?: string;
}

const convertSlackToZulipMarkdown = (text: string): string => {
  // Convert basic Slack markdown to Zulip markdown
  let result = text;

  // Slack bold: *text* -> Zulip bold: **text**
  // Be careful: Slack uses single asterisks, Zulip uses double
  result = result.replace("*", "**");

  // Slack links: <url|text> -> Zulip: [text](url)
  // Simple replacement for common patterns
  // Slack channel references: <#C123|channel-name> -> #**channel-name**
  // Slack user references: <@U123> -> @**user** (simplified)

  return result;
};

export const handleSlackIncomingDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  input: SlackIncomingInput
): Promise<Result<{ id: long }, string>> => {
  // Verify the user is a bot of type 2 (incoming webhook bot)
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const userId0 = user.userId;
    const tenantId0 = user.tenantId;
    const botUser = await db0.Users
      .Where((u) => u.TenantId === tenantId0).Where((u) => u.Id === userId0)
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

  // Parse Slack-format payload
  const body = input.body;
  const text = body["text"] as string | undefined;
  const channel = body["channel"] as string | undefined;
  const username = body["username"] as string | undefined;

  if (text === undefined || text.trim().length === 0) {
    return err("Message text must not be empty");
  }

  // Convert Slack markdown to Zulip markdown
  const content = convertSlackToZulipMarkdown(text);

  // Resolve stream: use explicit stream param, or channel from payload (strip # prefix)
  let stream = (input.stream ?? "").trim();
  if (stream.length === 0 && channel !== undefined) {
    let channelName = channel.trim();
    if (channelName.startsWith("#")) {
      channelName = channelName.substring(1);
    }
    stream = channelName;
  }

  if (stream.length === 0) {
    return err("Stream/channel must be specified");
  }

  // Topic: use explicit topic param, or username, or default
  let topic = (input.topic ?? "").trim();
  if (topic.length === 0) {
    if (username !== undefined && username.trim().length > 0) {
      topic = username.trim();
    } else {
      topic = "Slack incoming";
    }
  }

  // Send the message as the bot user
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
