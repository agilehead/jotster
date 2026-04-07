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

A<ChannelFolderItem>().add(PrimaryKeyAttribute, "ChannelFolderId", [
  "ChannelId",
]);
A<ChannelFolderItem>().add(IndexAttribute, ["ChannelId"]);
