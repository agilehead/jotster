import { attributes as A } from "@tsonic/core/lang.js";
import { PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class BotStorage {
  BotUserId!: string;
  Key!: string;
  Value!: string;
}

A.on(BotStorage).type.add(PrimaryKeyAttribute, "BotUserId", ["Key"]);
