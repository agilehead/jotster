import type { long } from "@tsonic/core/types.js";

export class AuthenticatedUser {
  tenantId!: long;
  userId!: long;
  email: string = "";
  role: number = 0;
  isBot: number = 0;
  botType?: number;
}
