import type { long } from "@tsonic/core/types.js";

export class Message {
  WorkspaceId!: string;
  Id!: string;
  SenderParticipantId!: string;
  ContainerKind!: string;
  ChannelId!: string | null;
  ThreadId!: string | null;
  DirectChatId!: string | null;
  Content!: string;
  RenderedContent!: string | null;
  State!: string;
  CreatedAt!: long;
  EditedAt!: long | null;
}
