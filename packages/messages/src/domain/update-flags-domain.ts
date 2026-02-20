import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToUser } from "@jotster/event-queue/Jotster.EventQueue.js";
import { addMessageFlags } from "../repo/add-message-flags.ts";
import { removeMessageFlags } from "../repo/remove-message-flags.ts";

const VALID_FLAGS = ["read", "starred", "mentioned", "wildcard_mentioned", "has_alert_word", "historical"];

interface UpdateFlagsDomainInput {
  messages: string[];
  op: string;
  flag: string;
}

export const updateFlagsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  params: UpdateFlagsDomainInput
): Promise<Result<{ messages: string[] }, string>> => {
  // Validate op
  if (params.op !== "add" && params.op !== "remove") {
    return err("Invalid operation: must be 'add' or 'remove'");
  }

  // Validate flag
  let flagValid = false;
  for (let i = 0; i < VALID_FLAGS.length; i++) {
    if (VALID_FLAGS[i] === params.flag) {
      flagValid = true;
      break;
    }
  }
  if (!flagValid) {
    return err("Invalid flag: " + params.flag);
  }

  // Validate messages array
  if (params.messages.length === 0) {
    return err("No messages specified");
  }

  if (params.op === "add") {
    await addMessageFlags(options, user.userId, params.messages, params.flag);
  } else {
    await removeMessageFlags(options, user.userId, params.messages, params.flag);
  }

  // Dispatch event
  dispatchEventToUser(user.tenantId, user.userId, {
    type: "update_message_flags",
    op: params.op,
    data: {
      flag: params.flag,
      messages: params.messages,
      all: false,
    },
  });

  return ok({ messages: params.messages });
};
