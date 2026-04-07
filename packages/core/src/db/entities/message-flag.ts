import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import {
  PrimaryKeyAttribute,
  IndexAttribute,
} from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class MessageFlag {
  UserId!: long;
  MessageId!: long;
  Flag!: string;
}

A<MessageFlag>().add(PrimaryKeyAttribute, "UserId", [
  "MessageId",
  "Flag",
]);
A<MessageFlag>().add(IndexAttribute, ["MessageId", "Flag"]);
A<MessageFlag>().add(IndexAttribute, ["UserId", "Flag", "MessageId"]);
