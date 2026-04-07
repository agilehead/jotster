import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class BotStorage {
  BotUserId!: long;
  Key!: string;
  Value!: string;
}

A<BotStorage>().add(PrimaryKeyAttribute, "BotUserId", ["Key"]);
