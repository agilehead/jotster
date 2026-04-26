import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class ParticipantPreference {
  WorkspaceId!: string;
  ParticipantId!: string;
  Key!: string;
  ValueJson!: string;
  UpdatedAt!: long;
}

A<ParticipantPreference>().add(PrimaryKeyAttribute, "WorkspaceId", ["ParticipantId","Key"]);
