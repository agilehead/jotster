import { attributes as A } from "@tsonic/core/lang.js";
import { PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class DefaultChannelGroupItem {
  DefaultChannelGroupId!: string;
  ChannelId!: string;
}

A.on(DefaultChannelGroupItem).type.add(PrimaryKeyAttribute, "DefaultChannelGroupId", ["ChannelId"]);
