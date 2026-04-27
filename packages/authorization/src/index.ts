import { PermissionGrant, generateId, requireWorkspaceMatch } from "@jotster/core";
import type { RequestContext } from "@jotster/core";
import type { long } from "@tsonic/core/types.js";

export const SUBJECT_PARTICIPANT = "participant";
export const SUBJECT_ROLE = "role";
export const SUBJECT_GROUP = "group";
export const SUBJECT_SYSTEM = "system";
export const SYSTEM_SUBJECT_JOTSTER = "jotster";
export const SYSTEM_SUBJECT_MIGRATION = "migration";

export const EFFECT_ALLOW = "allow";
export const EFFECT_DENY = "deny";

export const ACTION_WORKSPACE_READ = "workspace.read";
export const ACTION_WORKSPACE_MANAGE = "workspace.manage";
export const ACTION_CHANNEL_READ = "channel.read";
export const ACTION_CHANNEL_WRITE = "channel.write";
export const ACTION_CHANNEL_MANAGE = "channel.manage";
export const ACTION_THREAD_READ = "thread.read";
export const ACTION_THREAD_WRITE = "thread.write";
export const ACTION_THREAD_MANAGE = "thread.manage";
export const ACTION_MESSAGE_CREATE = "message.create";
export const ACTION_MESSAGE_EDIT_OWN = "message.edit.own";
export const ACTION_MESSAGE_EDIT_ANY = "message.edit.any";
export const ACTION_MESSAGE_DELETE_OWN = "message.delete.own";
export const ACTION_MESSAGE_DELETE_ANY = "message.delete.any";
export const ACTION_NOTIFICATION_MANAGE_SELF = "notification.manage_self";
export const ACTION_CREDENTIAL_MANAGE_SELF = "credential.manage_self";
export const ACTION_CREDENTIAL_MANAGE_ANY = "credential.manage_any";

export class SubjectRef {
  Kind!: string;
  Id!: string;
}

export class ResourcePath {
  WorkspaceId!: string;
  Kind!: string;
  Path!: string;
}

export class AuthorizationDecision {
  Allowed!: boolean;
  Reason!: string;
  MatchedGrantId?: string;
}

export interface AuthorizationInput {
  context: RequestContext;
  resource: ResourcePath;
  action: string;
  grants: PermissionGrant[];
  roleIds: string[];
  groupIds: string[];
  systemSubjectIds: string[];
  nowMs: long;
}

export interface PermissionSubjectRegistry {
  participantIds: string[];
  roleIds: string[];
  groupIds: string[];
  systemSubjectIds: string[];
}

export interface ChannelReadInput {
  context: RequestContext;
  channelVisibility: string;
  channelState: string;
  channelMemberState?: string;
  resource: ResourcePath;
  grants: PermissionGrant[];
  roleIds: string[];
  groupIds: string[];
  nowMs: long;
}

export interface ThreadAccessInput {
  context: RequestContext;
  threadAccessPolicy: string;
  channelAllowsAction: boolean;
  resource: ResourcePath;
  action: string;
  grants: PermissionGrant[];
  roleIds: string[];
  groupIds: string[];
  nowMs: long;
}

export function workspaceResource(workspaceId: string): string {
  return "/workspaces/" + workspaceId;
}

export function participantResource(workspaceId: string, participantId: string): string {
  return workspaceResource(workspaceId) + "/participants/" + participantId;
}

export function channelResource(workspaceId: string, channelId: string): string {
  return workspaceResource(workspaceId) + "/channels/" + channelId;
}

export function threadResource(workspaceId: string, channelId: string, threadId: string): string {
  return channelResource(workspaceId, channelId) + "/threads/" + threadId;
}

export function directChatResource(workspaceId: string, directChatId: string): string {
  return workspaceResource(workspaceId) + "/direct-chats/" + directChatId;
}

export function messageResource(workspaceId: string, messageId: string): string {
  return workspaceResource(workspaceId) + "/messages/" + messageId;
}

export function webhookResource(workspaceId: string, webhookId: string): string {
  return workspaceResource(workspaceId) + "/webhooks/" + webhookId;
}

export function credentialResource(workspaceId: string, credentialId: string): string {
  return workspaceResource(workspaceId) + "/credentials/" + credentialId;
}

export function createResourcePath(workspaceId: string, path: string): ResourcePath {
  if (!isResourceInWorkspace(path, workspaceId)) {
    throw new Error("Resource path is outside workspace");
  }
  const resource = new ResourcePath();
  resource.WorkspaceId = workspaceId;
  resource.Kind = inferResourceKind(path);
  resource.Path = path;
  return resource;
}

export function participantSubject(participantId: string): SubjectRef {
  const subject = new SubjectRef();
  subject.Kind = SUBJECT_PARTICIPANT;
  subject.Id = participantId;
  return subject;
}

export function roleSubject(roleId: string): SubjectRef {
  const subject = new SubjectRef();
  subject.Kind = SUBJECT_ROLE;
  subject.Id = roleId;
  return subject;
}

export function groupSubject(groupId: string): SubjectRef {
  const subject = new SubjectRef();
  subject.Kind = SUBJECT_GROUP;
  subject.Id = groupId;
  return subject;
}

export function systemSubject(name: string): SubjectRef {
  const subject = new SubjectRef();
  subject.Kind = SUBJECT_SYSTEM;
  subject.Id = name;
  return subject;
}

function validateSubject(subject: SubjectRef): void {
  if (
    subject.Kind !== SUBJECT_PARTICIPANT &&
    subject.Kind !== SUBJECT_ROLE &&
    subject.Kind !== SUBJECT_GROUP &&
    subject.Kind !== SUBJECT_SYSTEM
  ) {
    throw new Error("Unsupported permission subject kind");
  }
  if (subject.Id.trim().length === 0) {
    throw new Error("Permission subject id is required");
  }
  if (
    subject.Kind === SUBJECT_SYSTEM &&
    subject.Id !== SYSTEM_SUBJECT_JOTSTER &&
    subject.Id !== SYSTEM_SUBJECT_MIGRATION
  ) {
    throw new Error("Unsupported system permission subject");
  }
}

function validateEffect(effect: string): void {
  if (effect !== EFFECT_ALLOW && effect !== EFFECT_DENY) {
    throw new Error("Unsupported permission effect");
  }
}

export function subjectExistsInRegistry(
  subject: SubjectRef,
  registry: PermissionSubjectRegistry,
): boolean {
  if (subject.Kind === SUBJECT_PARTICIPANT) {
    return hasValue(registry.participantIds, subject.Id);
  }
  if (subject.Kind === SUBJECT_ROLE) {
    return hasValue(registry.roleIds, subject.Id);
  }
  if (subject.Kind === SUBJECT_GROUP) {
    return hasValue(registry.groupIds, subject.Id);
  }
  if (subject.Kind === SUBJECT_SYSTEM) {
    return hasValue(registry.systemSubjectIds, subject.Id);
  }
  return false;
}

export function requireSubjectExistsInWorkspace(
  subject: SubjectRef,
  registry: PermissionSubjectRegistry,
): void {
  validateSubject(subject);
  if (!subjectExistsInRegistry(subject, registry)) {
    throw new Error("Permission subject is not present in workspace");
  }
}

function inferResourceKind(path: string): string {
  if (path.indexOf("/channels/") >= 0 && path.indexOf("/threads/") >= 0) {
    return "thread";
  }
  if (path.indexOf("/channels/") >= 0) {
    return "channel";
  }
  if (path.indexOf("/direct-chats/") >= 0) {
    return "direct_chat";
  }
  if (path.indexOf("/messages/") >= 0) {
    return "message";
  }
  if (path.indexOf("/participants/") >= 0) {
    return "participant";
  }
  if (path.indexOf("/webhooks/") >= 0) {
    return "webhook";
  }
  if (path.indexOf("/credentials/") >= 0) {
    return "credential";
  }
  return "workspace";
}

function hasValue(values: string[], expected: string): boolean {
  for (let index = 0; index < values.length; index++) {
    if (values[index] === expected) {
      return true;
    }
  }
  return false;
}

function isGrantActive(grant: PermissionGrant, nowMs: long): boolean {
  return grant.ExpiresAt === undefined || grant.ExpiresAt > nowMs;
}

function actionMatches(grantAction: string, requestedAction: string): boolean {
  return grantAction === requestedAction || grantAction === "*";
}

function resourceMatches(grantResourcePath: string, requestedResourcePath: string): boolean {
  if (grantResourcePath === requestedResourcePath) {
    return true;
  }
  if (grantResourcePath.endsWith("/*")) {
    const prefix = grantResourcePath.substring(0, grantResourcePath.length - 2);
    return requestedResourcePath === prefix || requestedResourcePath.startsWith(prefix + "/");
  }
  return requestedResourcePath.startsWith(grantResourcePath + "/");
}

function subjectMatches(
  context: RequestContext,
  grant: PermissionGrant,
  roleIds: string[],
  groupIds: string[],
  systemSubjectIds: string[],
): boolean {
  if (grant.SubjectKind === SUBJECT_PARTICIPANT) {
    return grant.SubjectId === context.ParticipantId;
  }
  if (grant.SubjectKind === SUBJECT_ROLE) {
    return hasValue(roleIds, grant.SubjectId);
  }
  if (grant.SubjectKind === SUBJECT_GROUP) {
    return hasValue(groupIds, grant.SubjectId);
  }
  if (grant.SubjectKind === SUBJECT_SYSTEM) {
    return hasValue(systemSubjectIds, grant.SubjectId);
  }
  return false;
}

export function createPermissionGrantRecord(
  workspaceId: string,
  subjectKind: string,
  subjectId: string,
  resourcePath: string,
  action: string,
  effect: string,
  createdAt: long,
  expiresAt?: long,
): PermissionGrant {
  const subject = new SubjectRef();
  subject.Kind = subjectKind;
  subject.Id = subjectId;
  validateSubject(subject);
  validateEffect(effect);
  if (!isResourceInWorkspace(resourcePath, workspaceId)) {
    throw new Error("Permission resource path is outside workspace");
  }
  if (action.trim().length === 0) {
    throw new Error("Permission action is required");
  }

  const grant = new PermissionGrant();
  grant.Id = generateId("grant");
  grant.WorkspaceId = workspaceId;
  grant.SubjectKind = subjectKind;
  grant.SubjectId = subjectId;
  grant.ResourcePath = resourcePath;
  grant.Action = action;
  grant.Effect = effect;
  grant.CreatedAt = createdAt;
  grant.ExpiresAt = expiresAt;
  return grant;
}

export function createContextPermissionGrantRecord(
  context: RequestContext,
  subject: SubjectRef,
  resource: ResourcePath,
  action: string,
  effect: string,
  subjectRegistry: PermissionSubjectRegistry,
  createdAt: long,
  expiresAt?: long,
): PermissionGrant {
  requireWorkspaceMatch(context.WorkspaceId, resource.WorkspaceId);
  requireSubjectExistsInWorkspace(subject, subjectRegistry);
  return createPermissionGrantRecord(
    context.WorkspaceId,
    subject.Kind,
    subject.Id,
    resource.Path,
    action,
    effect,
    createdAt,
    expiresAt,
  );
}

export function createValidatedPermissionGrantRecord(
  context: RequestContext,
  subject: SubjectRef,
  resource: ResourcePath,
  action: string,
  effect: string,
  subjectRegistry: PermissionSubjectRegistry,
  createdAt: long,
  expiresAt?: long,
): PermissionGrant {
  return createContextPermissionGrantRecord(
    context,
    subject,
    resource,
    action,
    effect,
    subjectRegistry,
    createdAt,
    expiresAt,
  );
}

export function requireWorkspaceContext(context: RequestContext, workspaceId: string): void {
  requireWorkspaceMatch(context.WorkspaceId, workspaceId);
}

export function isResourceInWorkspace(resourcePath: string, workspaceId: string): boolean {
  return resourcePath === workspaceResource(workspaceId) || resourcePath.startsWith(workspaceResource(workspaceId) + "/");
}

export function deny(reason: string): AuthorizationDecision {
  const decision = new AuthorizationDecision();
  decision.Allowed = false;
  decision.Reason = reason;
  return decision;
}

export function allow(reason: string): AuthorizationDecision {
  const decision = new AuthorizationDecision();
  decision.Allowed = true;
  decision.Reason = reason;
  return decision;
}

function allowByGrant(reason: string, grantId: string): AuthorizationDecision {
  const decision = allow(reason);
  decision.MatchedGrantId = grantId;
  return decision;
}

function denyByGrant(reason: string, grantId: string): AuthorizationDecision {
  const decision = deny(reason);
  decision.MatchedGrantId = grantId;
  return decision;
}

export function evaluateAuthorization(input: AuthorizationInput): AuthorizationDecision {
  requireWorkspaceMatch(input.context.WorkspaceId, input.resource.WorkspaceId);
  if (!isResourceInWorkspace(input.resource.Path, input.context.WorkspaceId)) {
    return deny("resource outside workspace");
  }

  let allowDecision: AuthorizationDecision | undefined = undefined;
  for (let index = 0; index < input.grants.length; index++) {
    const grant = input.grants[index];
    if (grant.WorkspaceId !== input.context.WorkspaceId) {
      continue;
    }
    if (!isGrantActive(grant, input.nowMs)) {
      continue;
    }
    if (!subjectMatches(input.context, grant, input.roleIds, input.groupIds, input.systemSubjectIds)) {
      continue;
    }
    if (!actionMatches(grant.Action, input.action)) {
      continue;
    }
    if (!resourceMatches(grant.ResourcePath, input.resource.Path)) {
      continue;
    }
    if (grant.Effect === EFFECT_DENY) {
      return denyByGrant("explicit deny", grant.Id);
    }
    if (grant.Effect === EFFECT_ALLOW) {
      allowDecision = allowByGrant("explicit allow", grant.Id);
    }
  }

  if (allowDecision !== undefined) {
    return allowDecision;
  }
  return deny("no matching grant");
}

export function evaluateChannelRead(input: ChannelReadInput): AuthorizationDecision {
  requireWorkspaceMatch(input.context.WorkspaceId, input.resource.WorkspaceId);
  if (input.channelState !== "active") {
    return deny("channel inactive");
  }
  if (input.channelVisibility === "public") {
    return allow("public channel");
  }
  if (
    input.channelVisibility === "private" &&
    input.channelMemberState === "active"
  ) {
    return allow("channel member");
  }
  return evaluateAuthorization({
    context: input.context,
    resource: input.resource,
    action: ACTION_CHANNEL_READ,
    grants: input.grants,
    roleIds: input.roleIds,
    groupIds: input.groupIds,
    systemSubjectIds: [],
    nowMs: input.nowMs,
  });
}

export function evaluateThreadAccess(input: ThreadAccessInput): AuthorizationDecision {
  requireWorkspaceMatch(input.context.WorkspaceId, input.resource.WorkspaceId);
  if (input.threadAccessPolicy === "inherit" && input.channelAllowsAction) {
    return allow("thread inherits channel policy");
  }
  return evaluateAuthorization({
    context: input.context,
    resource: input.resource,
    action: input.action,
    grants: input.grants,
    roleIds: input.roleIds,
    groupIds: input.groupIds,
    systemSubjectIds: [],
    nowMs: input.nowMs,
  });
}

export function requireAllowed(decision: AuthorizationDecision): void {
  if (!decision.Allowed) {
    throw new Error("Forbidden: " + decision.Reason);
  }
}
