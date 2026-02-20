import { attributes as A } from "@tsonic/core/lang.js";
import { PrimaryKeyAttribute, IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class ChannelFolderItem {
  ChannelFolderId!: string;
  ChannelId!: string;
}

A.on(ChannelFolderItem).type.add(PrimaryKeyAttribute, "ChannelFolderId", ["ChannelId"]);
A.on(ChannelFolderItem).type.add(IndexAttribute, ["ChannelId"]);
