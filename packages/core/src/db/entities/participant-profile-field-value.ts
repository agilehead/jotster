import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class ParticipantProfileFieldValue {
  WorkspaceId!: string;
  ParticipantId!: string;
  ProfileFieldId!: string;
  ValueJson!: string;
  UpdatedAt!: long;
}

A<ParticipantProfileFieldValue>().add(PrimaryKeyAttribute, "WorkspaceId", ["ParticipantId","ProfileFieldId"]);
