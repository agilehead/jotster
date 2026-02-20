import { attributes as A } from "@tsonic/core/lang.js";
import { PrimaryKeyAttribute, IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class AttachmentMessage {
  AttachmentId!: string;
  MessageId!: string;
}

A.on(AttachmentMessage).type.add(PrimaryKeyAttribute, "AttachmentId", ["MessageId"]);
A.on(AttachmentMessage).type.add(IndexAttribute, ["MessageId"]);
