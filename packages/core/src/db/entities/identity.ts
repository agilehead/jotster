import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Identity {
  Id!: string;
  Kind!: string;
  PrimaryEmail?: string;
  DisplayName!: string;
  State!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<Identity>()
  .prop((x) => x.Id)
  .add(KeyAttribute);
A<Identity>().add(IndexAttribute, ["Kind","State"]);
A<Identity>().add(IndexAttribute, ["PrimaryEmail"]);
