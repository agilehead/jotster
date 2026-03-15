import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";

export class PublicIdCounter {
  EntityType!: string;
  NextValue!: long;
}

A.on(PublicIdCounter).prop((x) => x.EntityType).add(KeyAttribute);
