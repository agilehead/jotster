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

A<AttachmentMessage>().add(PrimaryKeyAttribute, "AttachmentId", [
  "MessageId",
]);
A<AttachmentMessage>().add(IndexAttribute, ["MessageId"]);
