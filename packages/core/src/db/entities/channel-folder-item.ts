import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import {
  PrimaryKeyAttribute,
  IndexAttribute,
} from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class ChannelFolderItem {
  ChannelFolderId!: long;
  ChannelId!: long;
}

A.on(ChannelFolderItem).type.add(PrimaryKeyAttribute, "ChannelFolderId", [
  "ChannelId",
]);
A.on(ChannelFolderItem).type.add(IndexAttribute, ["ChannelId"]);
