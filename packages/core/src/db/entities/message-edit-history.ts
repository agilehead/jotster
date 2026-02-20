import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class MessageEditHistory {
  Id!: string;
  MessageId!: string;
  UserId!: string;
  PrevContent?: string;
  PrevRenderedContent?: string;
  PrevTopic?: string;
  PrevChannelId?: string;
  Timestamp!: long;
}

A.on(MessageEditHistory).prop((x) => x.Id).add(KeyAttribute);
A.on(MessageEditHistory).type.add(IndexAttribute, ["MessageId", "Timestamp"]);
