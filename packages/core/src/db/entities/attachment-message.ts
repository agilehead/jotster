import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import {
  PrimaryKeyAttribute,
  IndexAttribute,
} from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class AttachmentMessage {
  AttachmentId!: long;
  MessageId!: long;
}

A.on(AttachmentMessage).type.add(PrimaryKeyAttribute, "AttachmentId", [
  "MessageId",
]);
A.on(AttachmentMessage).type.add(IndexAttribute, ["MessageId"]);
