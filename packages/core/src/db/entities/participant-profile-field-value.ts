import type { long } from "@tsonic/core/types.js";

export class ParticipantProfileFieldValue {
  WorkspaceId!: string;
  ParticipantId!: string;
  ProfileFieldId!: string;
  ValueJson!: string;
  UpdatedAt!: long;
}
