import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class DefaultChannelGroupItem {
  DefaultChannelGroupId!: string;
  ChannelId!: long;
}

A.on(DefaultChannelGroupItem).type.add(PrimaryKeyAttribute, "DefaultChannelGroupId", ["ChannelId"]);
