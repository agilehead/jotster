import { attributes as A } from "@tsonic/core/lang.js";
import { PrimaryKeyAttribute, IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class MessageFlag {
  UserId!: string;
  MessageId!: string;
  Flag!: string;
}

A.on(MessageFlag).type.add(PrimaryKeyAttribute, "UserId", ["MessageId", "Flag"]);
A.on(MessageFlag).type.add(IndexAttribute, ["MessageId", "Flag"]);
A.on(MessageFlag).type.add(IndexAttribute, ["UserId", "Flag", "MessageId"]);
