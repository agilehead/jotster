import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Notification {
  WorkspaceId!: string;
  Id!: string;
  ParticipantId!: string;
  ActivityType!: string;
  ObjectType!: string;
  ObjectId!: string;
  Reason!: string;
  PayloadJson!: string;
  CreatedAt!: long;
  ReadAt?: long;
  ConsumedAt?: long;
}

A<Notification>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<Notification>().add(IndexAttribute, ["WorkspaceId","ParticipantId","Id"]);
A<Notification>().add(IndexAttribute, ["WorkspaceId","ParticipantId","CreatedAt"]);
A<Notification>().add(IndexAttribute, ["WorkspaceId","ObjectType","ObjectId"]);
