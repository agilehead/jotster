export class AuthenticatedUser {
  tenantId: string = "";
  userId: string = "";
  email: string = "";
  role: number = 0;
  isBot: number = 0;
  botType?: number;
}
