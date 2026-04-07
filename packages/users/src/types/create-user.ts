import type { int, long } from "@tsonic/core/types.js";

export interface CreateUserDomainInput {
  email: string;
  password: string;
  fullName: string;
}

export interface CreateBotDomainInput {
  fullName: string;
  shortName: string;
  botType?: int;
}

export interface CreateBotDomainResult {
  userId: long;
  apiKey: string;
}

export interface CreateUserInput {
  tenantId: long;
  email: string;
  fullName: string;
  passwordHash?: string;
  role?: int;
  isBot?: int;
  botType?: int;
  botOwnerId?: long;
  timezone?: string;
  deliveryEmail?: string;
}
