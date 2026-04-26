import { strict as assert } from "node:assert";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const migrationPath = join(root, "database/jotster/sqlite/migrations/20260217000000_initial_schema.js");
const migrationText = readFileSync(migrationPath, "utf8");

function readText(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function walkFiles(dir: string): string[] {
  const absoluteDir = join(root, dir);
  if (!existsSync(absoluteDir)) {
    return [];
  }

  const files: string[] = [];
  for (const entry of readdirSync(absoluteDir)) {
    const absolutePath = join(absoluteDir, entry);
    const relativePath = relative(root, absolutePath);
    if (entry === "node_modules" || entry === "generated" || entry === "dist") {
      continue;
    }
    if (statSync(absolutePath).isDirectory()) {
      files.push(...walkFiles(relativePath));
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

function toSnakeCase(name: string): string {
  return name.replace(/[A-Z]/g, (value, index) => (index === 0 ? "" : "_") + value.toLowerCase());
}

describe("greenfield schema", () => {
  const tableBlocks = Array.from(
    migrationText.matchAll(/createTable\("([^"]+)", \(table\) => \{([\s\S]*?)\n  \}\);/g),
    (match) => ({ name: match[1], body: match[2] }),
  );

  it("contains only product-owned table names", () => {
    const tableNames = Array.from(
      migrationText.matchAll(/createTable\("([^"]+)"/g),
      (match) => match[1],
    );

    assert.equal(tableNames.length, 38);
    assert.deepEqual(tableNames, [
      "workspace",
      "workspace_domain",
      "identity",
      "human_profile",
      "agent_profile",
      "auth_provider",
      "external_identity",
      "workspace_member",
      "participant",
      "auth_session",
      "api_credential",
      "participant_preference",
      "role",
      "participant_role",
      "group",
      "group_member",
      "group_child",
      "permission_grant",
      "channel",
      "channel_member",
      "thread",
      "direct_chat",
      "direct_chat_member",
      "message",
      "message_version",
      "message_marker",
      "reaction",
      "attachment",
      "emoji",
      "profile_field",
      "participant_profile_field_value",
      "workspace_member_default",
      "webhook",
      "device_token",
      "audit_event",
      "notification",
      "notification_endpoint",
      "notification_delivery",
    ]);
  });

  it("matches the core entity file set", () => {
    const tableNames = Array.from(
      migrationText.matchAll(/createTable\("([^"]+)"/g),
      (match) => match[1],
    ).sort();
    const entityTables = readdirSync(join(root, "packages/core/src/db/entities"))
      .filter((file) => file.endsWith(".ts"))
      .map((file) => file.slice(0, -3).split("-").join("_"))
      .sort();

    assert.deepEqual(entityTables, tableNames);
  });

  it("keeps every workspace-owned row scoped to a workspace", () => {
    const globalTables = new Set([
      "workspace",
      "workspace_domain",
      "identity",
      "human_profile",
      "agent_profile",
    ]);

    for (const table of tableBlocks) {
      if (!globalTables.has(table.name)) {
        assert.ok(table.body.includes("workspace_id"), table.name + " must be workspace-scoped");
      }
    }
  });

  it("uses composite workspace primary keys for workspace-owned ids", () => {
    const compositeIdTables = new Set([
      "auth_provider",
      "external_identity",
      "workspace_member",
      "participant",
      "auth_session",
      "api_credential",
      "role",
      "group",
      "permission_grant",
      "channel",
      "thread",
      "direct_chat",
      "message",
      "message_version",
      "reaction",
      "attachment",
      "emoji",
      "profile_field",
      "webhook",
      "device_token",
      "audit_event",
      "notification",
      "notification_endpoint",
      "notification_delivery",
    ]);

    for (const table of tableBlocks) {
      if (compositeIdTables.has(table.name)) {
        assert.ok(
          table.body.includes('table.primary(["workspace_id", "id"])'),
          table.name + " must primary-key by workspace_id + id",
        );
      }

      assert.ok(
        !table.body.includes('table.string("id").primary()'),
        table.name + " must not use a bare id primary key",
      );
    }
  });

  it("uses composite workspace foreign keys for workspace-owned references", () => {
    const globallyReferencedTables = new Set([
      "workspace",
      "workspace_domain",
      "identity",
      "human_profile",
      "agent_profile",
    ]);
    const workspaceOwnedTables = new Set(
      tableBlocks.map((table) => table.name).filter((name) => !globallyReferencedTables.has(name)),
    );

    for (const table of tableBlocks) {
      const foreignKeys = Array.from(
        table.body.matchAll(
          /table\.foreign\(\[([^\]]*)\]\)\.references\(\[([^\]]*)\]\)\.inTable\("([^"]+)"\)/g,
        ),
        (match) => ({ columns: match[1], referencedColumns: match[2], targetTable: match[3] }),
      );

      for (const foreignKey of foreignKeys) {
        if (workspaceOwnedTables.has(foreignKey.targetTable)) {
          assert.ok(
            foreignKey.columns.includes('"workspace_id"'),
            table.name + " must include workspace_id when referencing " + foreignKey.targetTable,
          );
          assert.ok(
            foreignKey.referencedColumns.includes('"workspace_id"'),
            table.name + " must reference workspace_id when targeting " + foreignKey.targetTable,
          );
        }
      }

      assert.ok(
        !/\.references\("id"\)\.inTable\(/.test(table.body),
        table.name + " must not use bare id foreign keys",
      );
    }
  });

  it("removes redundant identity columns from workspace credentials", () => {
    const blocks = new Map(tableBlocks.map((table) => [table.name, table.body]));
    assert.ok(
      !blocks.get("auth_session")?.includes('table.string("identity_id")'),
      "auth_session must derive identity through participant membership",
    );
    assert.ok(
      !blocks.get("api_credential")?.includes('table.string("identity_id")'),
      "api_credential must derive identity through participant membership",
    );
  });

  it("enforces message container shape in the database", () => {
    const message = tableBlocks.find((table) => table.name === "message");
    assert.ok(message !== undefined, "message table must exist");
    assert.ok(
      message.body.includes("message_container_shape_ck"),
      "message must have a container shape check constraint",
    );
    assert.ok(
      message.body.includes("container_kind = 'channel_thread'"),
      "message check must validate channel thread shape",
    );
    assert.ok(
      message.body.includes("container_kind = 'direct_chat'"),
      "message check must validate direct chat shape",
    );
  });

  it("enforces permission grant subject and effect domains", () => {
    const grant = tableBlocks.find((table) => table.name === "permission_grant");
    assert.ok(grant !== undefined, "permission_grant table must exist");
    assert.ok(
      grant.body.includes("permission_grant_subject_kind_ck"),
      "permission_grant must constrain subject_kind",
    );
    assert.ok(
      grant.body.includes("permission_grant_effect_ck"),
      "permission_grant must constrain effect",
    );
  });

  it("binds notification deliveries to the same participant as their endpoint and notification", () => {
    const delivery = tableBlocks.find((table) => table.name === "notification_delivery");
    assert.ok(delivery !== undefined, "notification_delivery table must exist");
    assert.ok(
      delivery.body.includes('table.string("participant_id").notNullable()'),
      "notification_delivery must carry participant_id",
    );
    assert.ok(
      delivery.body.includes('["workspace_id", "participant_id", "notification_id"]'),
      "notification_delivery must FK notification through participant_id",
    );
    assert.ok(
      delivery.body.includes('["workspace_id", "participant_id", "endpoint_id"]'),
      "notification_delivery must FK endpoint through participant_id",
    );
  });
});

describe("package topology", () => {
  const expectedPackages = [
    "api-agent",
    "api-native",
    "api-zulip",
    "authorization",
    "collaboration",
    "core",
    "identity",
    "notifications",
    "server",
  ];

  it("uses the greenfield package set", () => {
    const packageDirs = readdirSync(join(root, "packages"))
      .filter((entry) => statSync(join(root, "packages", entry)).isDirectory())
      .sort();

    assert.deepEqual(packageDirs, expectedPackages);
  });

  it("does not reference removed package names", () => {
    const bannedPackages = [
      "@jotster/auth",
      "@jotster/channels",
      "@jotster/drafts",
      "@jotster/emoji",
      "@jotster/event-queue",
      "@jotster/messages",
      "@jotster/organization",
      "@jotster/permissions",
      "@jotster/presence",
      "@jotster/subscriptions",
      "@jotster/uploads",
      "@jotster/users",
      "@jotster/webhooks",
    ];
    const scannedFiles = ["package.json", "package-lock.json", ...walkFiles("packages")].filter(
      (file) => file.endsWith(".json") || file.endsWith(".ts"),
    );

    for (const file of scannedFiles) {
      const text = readText(file);
      for (const bannedPackage of bannedPackages) {
        const escaped = bannedPackage.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(escaped + "(?=[\\\"'/])");
        assert.ok(!pattern.test(text), file + " must not reference " + bannedPackage);
      }
    }
  });

  it("keeps CLR package names only in Tsonic/package exports", () => {
    const allowedPattern = /packages\/[^/]+\/(?:tsonic\.json|tsonic\.package\.json|package\.json)$/;
    const scannedFiles = walkFiles("packages").filter((file) => file.endsWith(".ts") || file.endsWith(".json"));

    for (const file of scannedFiles) {
      if (allowedPattern.test(file)) {
        continue;
      }
      const text = readText(file);
      assert.ok(!/Jotster\.[A-Z][A-Za-z.]+/.test(text), file + " must not contain CLR namespace names");
    }
  });
});

describe("product vocabulary", () => {
  const bannedOutsideEdge = /\b(realm|stream|topic|subscription|tenant)\b/i;
  const edgeAllowed = new Set(["spec/07-api-zulip-edge.md"]);

  it("keeps legacy compatibility vocabulary out of product specs", () => {
    for (const file of walkFiles("spec").filter((entry) => entry.endsWith(".md"))) {
      if (edgeAllowed.has(file)) {
        continue;
      }
      assert.ok(!bannedOutsideEdge.test(readText(file)), file + " must use product vocabulary only");
    }
  });

  it("keeps legacy compatibility vocabulary out of core product packages", () => {
    const scannedFiles = walkFiles("packages").filter(
      (file) =>
        (file.endsWith(".ts") || file.endsWith(".json")) &&
        !file.startsWith("packages/api-zulip/"),
    );

    for (const file of scannedFiles) {
      assert.ok(!bannedOutsideEdge.test(readText(file)), file + " must use product vocabulary only");
    }
  });
});

describe("attribute markers", () => {
  it("uses the greenfield callable attributes API only", () => {
    const entityFiles = walkFiles("packages/core/src/db/entities").filter((file) => file.endsWith(".ts"));

    for (const file of entityFiles) {
      const text = readText(file);
      assert.ok(!text.includes("A.on("), file + " must not use the removed A.on(...) marker API");
      assert.ok(!text.includes(".type.add("), file + " must not use the removed .type.add(...) marker API");
    }
  });
});

describe("security architecture gates", () => {
  it("exposes scoped, admin, and bootstrap contexts as separate types", () => {
    const dbContext = readText("packages/core/src/db/jotster-db-context.ts");
    const coreIndex = readText("packages/core/src/index.ts");

    assert.ok(dbContext.includes("class JotsterWorkspaceDbContext"), "workspace context type is required");
    assert.ok(dbContext.includes("class JotsterAdminDbContext"), "admin context type is required");
    assert.ok(dbContext.includes("class JotsterBootstrapDbContext"), "bootstrap context type is required");
    assert.ok(dbContext.includes("configureWorkspaceFilters"), "workspace query filters must be centralized");
    assert.ok(!coreIndex.includes("export { JotsterDbContext }"), "raw base context must not be exported");
  });

  it("keeps raw db context imports out of product packages", () => {
    const allowedFiles = new Set([
      "packages/core/src/db/design-time-dbcontext-factory.ts",
      "packages/core/src/db/jotster-db-context.ts",
    ]);
    const scannedFiles = walkFiles("packages").filter((file) => file.endsWith(".ts"));

    for (const file of scannedFiles) {
      if (allowedFiles.has(file)) {
        continue;
      }
      const text = readText(file);
      assert.ok(
        !/import[^;]*\bJotsterDbContext\b[^;]*from/.test(text),
        file + " must not import the raw unscoped JotsterDbContext",
      );
      assert.ok(
        !text.includes("createJotsterDbContext"),
        file + " must not construct the raw unscoped JotsterDbContext",
      );
    }
  });

  it("registers every workspace-owned entity in the scoped filter list", () => {
    const registryText = readText("packages/core/src/db/workspace-owned.ts");
    const dbContextText = readText("packages/core/src/db/jotster-db-context.ts");
    const globalEntities = new Set([
      "Workspace",
      "WorkspaceDomain",
      "Identity",
      "HumanProfile",
      "AgentProfile",
    ]);
    const entityNames = readdirSync(join(root, "packages/core/src/db/entities"))
      .filter((file) => file.endsWith(".ts"))
      .map((file) =>
        file
          .slice(0, -3)
          .split("-")
          .map((part) => part[0].toUpperCase() + part.slice(1))
          .join(""),
      );

    for (const entityName of entityNames) {
      if (globalEntities.has(entityName)) {
        continue;
      }
      assert.ok(
        registryText.includes('"' + entityName + '"'),
        entityName + " must be listed as workspace-owned",
      );
      assert.ok(
        dbContextText.includes("configureWorkspaceFilter<" + entityName + ">"),
        entityName + " must have a scoped query filter",
      );
    }
  });

  it("fails closed for production config", () => {
    const configText = readText("packages/core/src/config/load-config.ts");
    assert.ok(configText.includes("validateConfig"), "config validation must exist");
    assert.ok(configText.includes("JOTSTER_DEV_AUTH_ENABLED must be false in production"));
    assert.ok(configText.includes("JOTSTER_JWT_SECRET must be at least 32 characters in production"));
    assert.ok(configText.includes("JOTSTER_LISTEN_URL must be HTTPS"));
  });

  it("does not manually concatenate JSON payloads", () => {
    const scannedFiles = walkFiles("packages").filter((file) => file.endsWith(".ts"));
    const jsonConcatPattern = /"\\{[^"]*"\\s*\\+/;

    for (const file of scannedFiles) {
      assert.ok(!jsonConcatPattern.test(readText(file)), file + " must not manually concatenate JSON");
    }
  });

  it("guards workspace-owned writes before every save", () => {
    const dbContextText = readText("packages/core/src/db/jotster-db-context.ts");
    const workspaceOwnedText = readText("packages/core/src/db/workspace-owned.ts");

    assert.ok(workspaceOwnedText.includes("isWorkspaceOwnedEntity"), "workspace-owned structural guard is required");
    assert.ok(dbContextText.includes("ValidateWorkspaceWrites"), "scoped context must validate writes");
    assert.ok(dbContextText.includes("this.ChangeTracker.Entries()"), "write guard must inspect tracked entities");
    assert.ok(dbContextText.includes("EntityState.Added"), "write guard must check added entities");
    assert.ok(dbContextText.includes("EntityState.Modified"), "write guard must check modified entities");
    assert.ok(dbContextText.includes("EntityState.Deleted"), "write guard must check deleted entities");
    assert.ok(dbContextText.includes("override SaveChanges("), "sync SaveChanges must be guarded");
    assert.ok(dbContextText.includes("override SaveChangesAsync("), "async SaveChanges must be guarded");
  });

  it("has a real request security pipeline before protected handlers", () => {
    const pipelineText = readText("packages/server/src/security-pipeline.ts");
    const appText = readText("packages/server/src/app.ts");
    const serverTsconfig = readText("packages/server/tsconfig.json");
    const serverPackage = readText("packages/server/package.json");

    assert.ok(pipelineText.includes("selectTrustedHost"), "trusted host selection is required");
    assert.ok(pipelineText.includes("canonicalizeRequestHost"), "host canonicalization is required");
    assert.ok(pipelineText.includes('host.indexOf("://")'), "request host must reject URL-shaped input");
    assert.ok(pipelineText.includes("stripOptionalPort"), "request host canonicalization must handle ports explicitly");
    assert.ok(pipelineText.includes("resolveWorkspaceIdByDomain"), "domain must resolve workspace before auth");
    assert.ok(pipelineText.includes("createWorkspaceDbContext"), "request pipeline must create scoped DB");
    assert.ok(pipelineText.includes("hashAuthenticatorSecret"), "raw authenticators must be hashed before lookup");
    assert.ok(pipelineText.includes("authenticateSession"), "session auth must be pipeline-supported");
    assert.ok(pipelineText.includes("authenticateApiCredential"), "API credential auth must be pipeline-supported");
    assert.ok(pipelineText.includes("isPublicRoute"), "public routes must be explicit");
    assert.ok(appText.includes("maxJsonBodyBytes"), "server must enforce configured JSON body limit");
    assert.ok(serverTsconfig.includes("src/**/*.ts"), "server package must typecheck all source files");
    assert.ok(serverPackage.includes("@jotster/identity"), "server must depend on identity pipeline package");
  });

  it("keeps user-controlled workspace ids out of request security", () => {
    const scannedFiles = walkFiles("packages").filter((file) => file.endsWith(".ts"));
    const bodyWorkspacePattern = /\bbody\b[\s\S]{0,80}\bworkspaceId\b|\bworkspaceId\b[\s\S]{0,80}\bbody\b/;

    for (const file of scannedFiles) {
      const text = readText(file);
      assert.ok(!bodyWorkspacePattern.test(text), file + " must not derive workspace from request body");
    }
  });

  it("authenticates sessions and credentials by workspace-scoped lookup", () => {
    const identityText = readText("packages/identity/src/index.ts");
    const authSessionEntity = readText("packages/core/src/db/entities/auth-session.ts");
    const apiCredentialEntity = readText("packages/core/src/db/entities/api-credential.ts");

    assert.ok(identityText.includes("hashAuthenticatorSecret"), "authenticator hashing helper is required");
    assert.ok(identityText.includes("authenticateSession("), "session auth must return context");
    assert.ok(identityText.includes("authenticateApiCredential("), "credential auth must return context");
    assert.ok(identityText.includes("db.RequireWorkspace(workspaceId)"), "auth lookups must require scoped DB workspace");
    assert.ok(identityText.includes("workspaceMember.IdentityId"), "auth context must derive identity through membership");
    assert.ok(!authSessionEntity.includes("IdentityId"), "auth_session must not carry redundant identity");
    assert.ok(!apiCredentialEntity.includes("IdentityId"), "api_credential must not carry redundant identity");
    assert.ok(!identityText.includes("session.IdentityId"), "session creation must not assign redundant identity");
    assert.ok(!identityText.includes("credential.IdentityId"), "credential creation must not assign redundant identity");
  });

  it("implements a generic authorization evaluator with deny precedence", () => {
    const authorizationText = readText("packages/authorization/src/index.ts");

    assert.ok(authorizationText.includes("export function evaluateAuthorization"), "generic evaluator is required");
    assert.ok(authorizationText.includes("resourceMatches"), "resource matching must be centralized");
    assert.ok(authorizationText.includes("subjectMatches"), "subject matching must be centralized");
    assert.ok(authorizationText.includes("grant.Effect === EFFECT_DENY"), "deny grants must be explicit");
    assert.ok(authorizationText.indexOf("grant.Effect === EFFECT_DENY") < authorizationText.indexOf("grant.Effect === EFFECT_ALLOW"), "deny must be checked before allow");
    assert.ok(authorizationText.includes("SYSTEM_SUBJECT_JOTSTER"), "system subjects must be allowlisted");
    assert.ok(authorizationText.includes("evaluateChannelRead"), "channel policy adapter must use evaluator");
    assert.ok(authorizationText.includes("evaluateThreadAccess"), "thread policy adapter must use evaluator");
  });

  it("hardens notifications for agents and webhook delivery", () => {
    const notificationText = readText("packages/notifications/src/index.ts");

    assert.ok(notificationText.includes("generateId(\"queue\")"), "queue ids must be opaque generated ids");
    assert.ok(notificationText.includes("getAuthorizedQueue"), "queue reads/deletes must check owner context");
    assert.ok(notificationText.includes("Notification dispatch requires participant filtering"), "workspace-wide blind dispatch must fail");
    assert.ok(notificationText.includes("validateNotificationEndpointConfig"), "endpoint config validation is required");
    assert.ok(notificationText.includes("assertSafeWebhookUrl"), "webhook target validation is required");
    assert.ok(notificationText.includes("HMACSHA256.HashData"), "webhook payloads must be signed");
    assert.ok(notificationText.includes("computeNextRetryAt"), "delivery retry policy is required");
    assert.ok(notificationText.includes("validateNotificationDeliveryOwnership"), "delivery ownership must be checked in service code");
  });

  it("moves API surfaces from planned stubs to secured contracts", () => {
    const nativeText = readText("packages/api-native/src/index.ts");
    const agentText = readText("packages/api-agent/src/index.ts");
    const zulipText = readText("packages/api-zulip/src/index.ts");

    assert.ok(!nativeText.includes('status: "planned"'), "native API must not be a planned stub");
    assert.ok(!agentText.includes('status: "planned"'), "agent API must not be a planned stub");
    assert.ok(!zulipText.includes('status: "planned"'), "Zulip edge must not be a planned stub");
    assert.ok(nativeText.includes("getNativeApiRoutes"), "native route contract is required");
    assert.ok(agentText.includes("getAgentApiRoutes"), "agent route contract is required");
    assert.ok(zulipText.includes("getZulipApiRoutes"), "Zulip route contract is required");
  });
});
