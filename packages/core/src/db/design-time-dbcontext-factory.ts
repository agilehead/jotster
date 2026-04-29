import { Environment } from "@tsonic/dotnet/System.js";
import type { Interface } from "@tsonic/core/lang.js";
import type { IDesignTimeDbContextFactory } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.Design.js";

import {
  createAdminDbContext,
  createBootstrapDbContext,
  createWorkspaceDbContext,
} from "./jotster-db-context.ts";
import {
  AdminContext,
  RequestContext,
} from "../types/request-context.ts";
import type {
  JotsterAdminDbContext,
  JotsterBootstrapDbContext,
  JotsterWorkspaceDbContext,
} from "./jotster-db-context.ts";
import { createDbOptions } from "./create-db-options.ts";

function getDesignTimeDbPath(): string {
  return Environment.GetEnvironmentVariable("JOTSTER_DB") ?? "jotster.db";
}

function createDesignTimeRequestContext(): RequestContext {
  const context = new RequestContext();
  context.WorkspaceId = "design-time-workspace";
  context.Domain = "design-time.local";
  context.IdentityId = "design-time-identity";
  context.WorkspaceMemberId = "design-time-member";
  context.ParticipantId = "design-time-participant";
  context.Audience = "design-time";
  context.AuthKind = "design-time";
  context.Scopes = [];
  return context;
}

function createDesignTimeAdminContext(): AdminContext {
  const context = new AdminContext();
  context.IdentityId = "design-time-admin";
  context.AuthKind = "design-time";
  context.Reason = "Design-time EF model generation";
  context.Scopes = [];
  return context;
}

export class JotsterBootstrapDbContextFactory implements Interface<
  IDesignTimeDbContextFactory<JotsterBootstrapDbContext>
> {
  CreateDbContext(_args: string[]): JotsterBootstrapDbContext {
    return createBootstrapDbContext(createDbOptions(getDesignTimeDbPath()));
  }
}

export class JotsterWorkspaceDbContextFactory implements Interface<
  IDesignTimeDbContextFactory<JotsterWorkspaceDbContext>
> {
  CreateDbContext(_args: string[]): JotsterWorkspaceDbContext {
    return createWorkspaceDbContext(
      createDbOptions(getDesignTimeDbPath()),
      createDesignTimeRequestContext(),
    );
  }
}

export class JotsterAdminDbContextFactory implements Interface<
  IDesignTimeDbContextFactory<JotsterAdminDbContext>
> {
  CreateDbContext(_args: string[]): JotsterAdminDbContext {
    return createAdminDbContext(
      createDbOptions(getDesignTimeDbPath()),
      createDesignTimeAdminContext(),
    );
  }
}
