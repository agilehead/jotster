export class RequestContext {
  WorkspaceId!: string;
  Domain!: string;
  IdentityId!: string;
  WorkspaceMemberId!: string;
  ParticipantId!: string;
  Audience!: string;
  AuthKind!: string;
  AuthenticatorId?: string;
  Scopes: string[] = [];
}

export class AdminContext {
  IdentityId!: string;
  Reason!: string;
  AuthKind!: string;
  Scopes: string[] = [];
}

export class BootstrapContext {
  Purpose!: string;
}

export class WorkspaceContext {
  WorkspaceId!: string;
  Domain!: string;
}
