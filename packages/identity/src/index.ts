import {
  AgentProfile,
  ApiCredential,
  AuthProvider,
  AuthSession,
  ExternalIdentity,
  HumanProfile,
  Identity,
  Participant,
  ParticipantPreference,
  RequestContext,
  WorkspaceDomain,
  WorkspaceMember,
  generateId,
} from "@jotster/core";
import type {
  JotsterBootstrapDbContext,
  JotsterWorkspaceDbContext,
} from "@jotster/core";
import type { long } from "@tsonic/core/types.js";
import { Convert } from "@tsonic/dotnet/System.js";
import { SHA256 } from "@tsonic/dotnet/System.Security.Cryptography.js";
import { Encoding } from "@tsonic/dotnet/System.Text.js";

export const AUTH_PROVIDER_KIND_OIDC = "oidc";
export const AUTH_PROVIDER_KIND_SAML = "saml";
export const AUTH_PROVIDER_KIND_PASSWORDLESS = "passwordless";

export interface CreateRequestContextInput {
  workspaceId: string;
  domain: string;
  identityId: string;
  workspaceMemberId: string;
  participantId: string;
  audience: string;
  authKind: string;
  authenticatorId?: string;
  scopes: string[];
}

export interface CreateApiCredentialInput {
  workspaceId: string;
  participantId: string;
  name: string;
  credentialHash: string;
  scopesJson: string;
  createdByParticipantId?: string;
  createdAt: long;
  expiresAt?: long;
}

export interface CreateAuthProviderInput {
  workspaceId: string;
  kind: string;
  displayName: string;
  issuer: string;
  clientId: string;
  configJson?: string;
  enabled?: boolean;
  createdAt: long;
}

export interface CreateExternalIdentityInput {
  workspaceId: string;
  identityId: string;
  authProviderId: string;
  subject: string;
  emailAtLogin?: string;
  claimsJson?: string;
  lastLoginAt?: long;
  createdAt: long;
}

export interface AuthenticatedCredentialInput {
  db: JotsterWorkspaceDbContext;
  workspaceId: string;
  domain: string;
  audience: string;
  authKind: string;
  authenticatorId: string;
  participantId: string;
  scopes: string[];
}

export interface ExternalIdentityAuthInput {
  db: JotsterWorkspaceDbContext;
  workspaceId: string;
  domain: string;
  audience: string;
  authProviderId: string;
  subject: string;
  nowMs: long;
}

export function normalizeDomain(domain: string): string {
  let normalized = domain.trim().toLowerCase();
  const schemeIndex = normalized.indexOf("://");
  if (schemeIndex >= 0) {
    normalized = normalized.substring(schemeIndex + 3);
  }
  const slashIndex = normalized.indexOf("/");
  if (slashIndex >= 0) {
    normalized = normalized.substring(0, slashIndex);
  }
  const colonIndex = normalized.lastIndexOf(":");
  if (colonIndex > 0 && normalized.indexOf("]") < 0) {
    normalized = normalized.substring(0, colonIndex);
  }
  if (normalized.length === 0) {
    throw new Error("Domain is required");
  }
  if (normalized.indexOf("..") >= 0) {
    throw new Error("Domain is invalid");
  }
  return normalized;
}

function validateAuthProviderKind(kind: string): string {
  const normalized = kind.trim().toLowerCase();
  if (
    normalized !== AUTH_PROVIDER_KIND_OIDC &&
    normalized !== AUTH_PROVIDER_KIND_SAML &&
    normalized !== AUTH_PROVIDER_KIND_PASSWORDLESS
  ) {
    throw new Error("Unsupported auth provider kind");
  }
  return normalized;
}

function normalizeProviderSubject(subject: string): string {
  const normalized = subject.trim();
  if (normalized.length === 0) {
    throw new Error("External identity subject is required");
  }
  return normalized;
}

function normalizeProviderText(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error(fieldName + " is required");
  }
  return normalized;
}

function validateJsonObjectText(value: string, fieldName: string): string {
  const normalized = value.trim().length === 0 ? "{}" : value.trim();
  const parsed: unknown = JSON.parse(normalized);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(fieldName + " must be a JSON object");
  }
  return normalized;
}

export function hashAuthenticatorSecret(secret: string): string {
  const bytes = Encoding.UTF8.GetBytes(secret);
  const hash = SHA256.HashData(bytes);
  return Convert.ToHexStringLower(hash);
}

export function createRequestContext(input: CreateRequestContextInput): RequestContext {
  const context = new RequestContext();
  context.WorkspaceId = input.workspaceId;
  context.Domain = normalizeDomain(input.domain);
  context.IdentityId = input.identityId;
  context.WorkspaceMemberId = input.workspaceMemberId;
  context.ParticipantId = input.participantId;
  context.Audience = input.audience;
  context.AuthKind = input.authKind;
  context.AuthenticatorId = input.authenticatorId;
  context.Scopes = input.scopes;
  return context;
}

function parseScopesJson(scopesJson: string): string[] {
  if (scopesJson.trim().length === 0) {
    return [];
  }
  const parsed: unknown = JSON.parse(scopesJson);
  if (!Array.isArray(parsed)) {
    return [];
  }
  const scopes: string[] = [];
  for (let index = 0; index < parsed.length; index++) {
    const scope = parsed[index];
    if (typeof scope === "string" && scope.trim().length > 0) {
      scopes.push(scope);
    }
  }
  return scopes;
}

export async function resolveWorkspaceIdByDomain(
  db: JotsterBootstrapDbContext,
  domain: string,
): Promise<string | undefined> {
  const normalized = normalizeDomain(domain);
  const workspaceDomain = await db.WorkspaceDomains.Where(
    (entry) => entry.Domain === normalized && entry.State === "active",
  ).FirstOrDefaultAsync();
  return workspaceDomain?.WorkspaceId;
}

async function createAuthenticatedContext(
  input: AuthenticatedCredentialInput,
): Promise<RequestContext | undefined> {
  input.db.RequireWorkspace(input.workspaceId);
  const participant = await input.db.Participants.Where(
    (entry) => entry.Id === input.participantId && entry.State === "active",
  ).FirstOrDefaultAsync();
  if (participant === null) {
    return undefined;
  }

  const workspaceMember = await input.db.WorkspaceMembers.Where(
    (entry) => entry.Id === participant.WorkspaceMemberId && entry.State === "active",
  ).FirstOrDefaultAsync();
  if (workspaceMember === null) {
    return undefined;
  }

  return createRequestContext({
    workspaceId: input.workspaceId,
    domain: input.domain,
    identityId: workspaceMember.IdentityId,
    workspaceMemberId: workspaceMember.Id,
    participantId: participant.Id,
    audience: input.audience,
    authKind: input.authKind,
    authenticatorId: input.authenticatorId,
    scopes: input.scopes,
  });
}

export async function authenticateSession(
  db: JotsterWorkspaceDbContext,
  workspaceId: string,
  domain: string,
  audience: string,
  sessionHash: string,
  nowMs: long,
): Promise<RequestContext | undefined> {
  db.RequireWorkspace(workspaceId);
  const session = await db.AuthSessions.Where(
    (entry) =>
      entry.SessionHash === sessionHash &&
      entry.State === "active" &&
      entry.ExpiresAt > nowMs &&
      entry.RevokedAt === null,
  ).FirstOrDefaultAsync();
  if (session === null) {
    return undefined;
  }

  return await createAuthenticatedContext({
    db,
    workspaceId,
    domain,
    audience,
    authKind: "session",
    authenticatorId: session.Id,
    participantId: session.ParticipantId,
    scopes: [],
  });
}

export async function authenticateApiCredential(
  db: JotsterWorkspaceDbContext,
  workspaceId: string,
  domain: string,
  audience: string,
  credentialHash: string,
  nowMs: long,
): Promise<RequestContext | undefined> {
  db.RequireWorkspace(workspaceId);
  const credential = await db.ApiCredentials.Where(
    (entry) =>
      entry.CredentialHash === credentialHash &&
      entry.RevokedAt === null &&
      (entry.ExpiresAt === null || entry.ExpiresAt > nowMs),
  ).FirstOrDefaultAsync();
  if (credential === null) {
    return undefined;
  }

  return await createAuthenticatedContext({
    db,
    workspaceId,
    domain,
    audience,
    authKind: "api_credential",
    authenticatorId: credential.Id,
    participantId: credential.ParticipantId,
    scopes: parseScopesJson(credential.ScopesJson),
  });
}

export async function authenticateExternalIdentity(
  input: ExternalIdentityAuthInput,
): Promise<RequestContext | undefined> {
  input.db.RequireWorkspace(input.workspaceId);
  const provider = await input.db.AuthProviders.Where(
    (entry) => entry.Id === input.authProviderId && entry.Enabled === 1,
  ).FirstOrDefaultAsync();
  if (provider === null) {
    return undefined;
  }

  const subject = normalizeProviderSubject(input.subject);
  const externalIdentity = await input.db.ExternalIdentities.Where(
    (entry) => entry.AuthProviderId === provider.Id && entry.Subject === subject,
  ).FirstOrDefaultAsync();
  if (externalIdentity === null) {
    return undefined;
  }

  const workspaceMember = await input.db.WorkspaceMembers.Where(
    (entry) => entry.IdentityId === externalIdentity.IdentityId && entry.State === "active",
  ).FirstOrDefaultAsync();
  if (workspaceMember === null) {
    return undefined;
  }

  const participant = await input.db.Participants.Where(
    (entry) => entry.WorkspaceMemberId === workspaceMember.Id && entry.State === "active",
  ).FirstOrDefaultAsync();
  if (participant === null) {
    return undefined;
  }

  return createRequestContext({
    workspaceId: input.workspaceId,
    domain: input.domain,
    identityId: workspaceMember.IdentityId,
    workspaceMemberId: workspaceMember.Id,
    participantId: participant.Id,
    audience: input.audience,
    authKind: "sso",
    authenticatorId: externalIdentity.Id,
    scopes: [],
  });
}

export async function authenticateSessionHash(
  db: JotsterWorkspaceDbContext,
  context: RequestContext,
  sessionHash: string,
  nowMs: long,
): Promise<boolean> {
  db.RequireWorkspace(context.WorkspaceId);
  const session = await db.AuthSessions.Where(
    (entry) =>
      entry.SessionHash === sessionHash &&
      entry.ParticipantId === context.ParticipantId &&
      entry.State === "active" &&
      entry.ExpiresAt > nowMs &&
      entry.RevokedAt === null,
  ).FirstOrDefaultAsync();
  return session !== null;
}

export async function authenticateApiCredentialHash(
  db: JotsterWorkspaceDbContext,
  context: RequestContext,
  credentialHash: string,
  nowMs: long,
): Promise<boolean> {
  db.RequireWorkspace(context.WorkspaceId);
  const credential = await db.ApiCredentials.Where(
    (entry) =>
      entry.CredentialHash === credentialHash &&
      entry.ParticipantId === context.ParticipantId &&
      entry.RevokedAt === null &&
      (entry.ExpiresAt === null || entry.ExpiresAt > nowMs),
  ).FirstOrDefaultAsync();
  return credential !== null;
}

export function createWorkspaceDomainRecord(
  workspaceId: string,
  domain: string,
  isPrimary: boolean,
  createdAt: long,
): WorkspaceDomain {
  const record = new WorkspaceDomain();
  record.Domain = normalizeDomain(domain);
  record.WorkspaceId = workspaceId;
  record.IsPrimary = isPrimary ? 1 : 0;
  record.State = "active";
  record.CreatedAt = createdAt;
  record.UpdatedAt = createdAt;
  return record;
}

export function createAuthProviderRecord(input: CreateAuthProviderInput): AuthProvider {
  const provider = new AuthProvider();
  provider.Id = generateId("authp");
  provider.WorkspaceId = input.workspaceId;
  provider.Kind = validateAuthProviderKind(input.kind);
  provider.DisplayName = normalizeProviderText(input.displayName, "Auth provider display name");
  provider.Issuer = normalizeProviderText(input.issuer, "Auth provider issuer");
  provider.ClientId = normalizeProviderText(input.clientId, "Auth provider client id");
  provider.ConfigJson = validateJsonObjectText(input.configJson ?? "{}", "Auth provider config_json");
  provider.Enabled = input.enabled === false ? 0 : 1;
  provider.CreatedAt = input.createdAt;
  provider.UpdatedAt = input.createdAt;
  return provider;
}

export function createExternalIdentityRecord(input: CreateExternalIdentityInput): ExternalIdentity {
  const externalIdentity = new ExternalIdentity();
  externalIdentity.Id = generateId("extid");
  externalIdentity.WorkspaceId = input.workspaceId;
  externalIdentity.IdentityId = normalizeProviderText(input.identityId, "External identity identity id");
  externalIdentity.AuthProviderId = normalizeProviderText(input.authProviderId, "External identity auth provider id");
  externalIdentity.Subject = normalizeProviderSubject(input.subject);
  externalIdentity.EmailAtLogin = input.emailAtLogin ?? null;
  externalIdentity.ClaimsJson = validateJsonObjectText(input.claimsJson ?? "{}", "External identity claims_json");
  externalIdentity.LastLoginAt = input.lastLoginAt ?? null;
  externalIdentity.CreatedAt = input.createdAt;
  externalIdentity.UpdatedAt = input.createdAt;
  return externalIdentity;
}

export function createIdentityRecord(
  kind: string,
  displayName: string,
  primaryEmail: string | undefined,
  createdAt: long,
): Identity {
  const identity = new Identity();
  identity.Id = generateId(kind === "agent" ? "id_agent" : "id_human");
  identity.Kind = kind;
  identity.PrimaryEmail = primaryEmail ?? null;
  identity.DisplayName = displayName;
  identity.State = "active";
  identity.CreatedAt = createdAt;
  identity.UpdatedAt = createdAt;
  return identity;
}

export function createHumanProfileRecord(
  identityId: string,
  fullName: string,
  avatarUrl: string | undefined,
  timezone: string,
  locale: string,
  createdAt: long,
): HumanProfile {
  const profile = new HumanProfile();
  profile.IdentityId = identityId;
  profile.FullName = fullName;
  profile.AvatarUrl = avatarUrl ?? null;
  profile.Timezone = timezone;
  profile.Locale = locale;
  profile.CreatedAt = createdAt;
  profile.UpdatedAt = createdAt;
  return profile;
}

export function createAgentProfileRecord(
  identityId: string,
  ownerIdentityId: string | undefined,
  agentKind: string,
  displayName: string,
  description: string,
  createdAt: long,
): AgentProfile {
  const profile = new AgentProfile();
  profile.IdentityId = identityId;
  profile.OwnerIdentityId = ownerIdentityId ?? null;
  profile.AvatarUrl = null;
  profile.AgentKind = agentKind;
  profile.DisplayName = displayName;
  profile.Description = description;
  profile.CreatedAt = createdAt;
  profile.UpdatedAt = createdAt;
  return profile;
}

export function createWorkspaceMemberRecord(
  workspaceId: string,
  identityId: string,
  joinedAt: long,
): WorkspaceMember {
  const member = new WorkspaceMember();
  member.Id = generateId("wm");
  member.WorkspaceId = workspaceId;
  member.IdentityId = identityId;
  member.State = "active";
  member.JoinedAt = joinedAt;
  member.CreatedAt = joinedAt;
  member.UpdatedAt = joinedAt;
  return member;
}

export function createParticipantRecord(
  workspaceId: string,
  workspaceMemberId: string,
  kind: string,
  displayName: string,
  avatarUrl: string | undefined,
  createdAt: long,
): Participant {
  const participant = new Participant();
  participant.Id = generateId("p");
  participant.WorkspaceId = workspaceId;
  participant.WorkspaceMemberId = workspaceMemberId;
  participant.Kind = kind;
  participant.DisplayName = displayName;
  participant.AvatarUrl = avatarUrl ?? null;
  participant.State = "active";
  participant.CreatedAt = createdAt;
  participant.UpdatedAt = createdAt;
  return participant;
}

export function createParticipantPreferenceRecord(
  workspaceId: string,
  participantId: string,
  key: string,
  valueJson: string,
  updatedAt: long,
): ParticipantPreference {
  const preference = new ParticipantPreference();
  preference.WorkspaceId = workspaceId;
  preference.ParticipantId = participantId;
  preference.Key = key;
  preference.ValueJson = valueJson;
  preference.UpdatedAt = updatedAt;
  return preference;
}

export function createApiCredentialRecord(input: CreateApiCredentialInput): ApiCredential {
  const credential = new ApiCredential();
  credential.Id = generateId("cred");
  credential.WorkspaceId = input.workspaceId;
  credential.ParticipantId = input.participantId;
  credential.Name = input.name;
  credential.CredentialHash = input.credentialHash;
  credential.ScopesJson = input.scopesJson;
  credential.CreatedByParticipantId = input.createdByParticipantId ?? null;
  credential.CreatedAt = input.createdAt;
  credential.ExpiresAt = input.expiresAt ?? null;
  credential.RevokedAt = null;
  return credential;
}

export function createAuthSessionRecord(
  context: RequestContext,
  sessionHash: string,
  createdAt: long,
  expiresAt: long,
): AuthSession {
  const session = new AuthSession();
  session.Id = generateId("session");
  session.WorkspaceId = context.WorkspaceId;
  session.ParticipantId = context.ParticipantId;
  session.SessionHash = sessionHash;
  session.State = "active";
  session.CreatedAt = createdAt;
  session.ExpiresAt = expiresAt;
  session.RevokedAt = null;
  return session;
}
