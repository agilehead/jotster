import type { long } from "@tsonic/core/types.js";

export class Message {
  WorkspaceId!: string;
  Id!: string;
  SenderParticipantId!: string;
  ContainerKind!: string;
  ChannelId?: string;
  ThreadId?: string;
  DirectChatId?: string;
  Content!: string;
  RenderedContent?: string;
  State!: string;
  CreatedAt!: long;
  EditedAt?: long;
}
