import type { long } from "@tsonic/core/types.js";

export class ParticipantPreference {
  WorkspaceId!: string;
  ParticipantId!: string;
  Key!: string;
  ValueJson!: string;
  UpdatedAt!: long;
}
