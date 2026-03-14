import type { Knex } from "knex";
import { createApiClient, type ApiClient } from "./api-client.js";
import crypto from "crypto";

function getServerBaseUrl(): string {
  return process.env.JOTSTER_TEST_BASE_URL ?? "http://localhost:9877";
}

/**
 * Seed a tenant directly into the database and return its ID.
 */
export async function seedTenant(
  db: Knex,
  overrides?: Partial<{
    id: string;
    subdomain: string;
    name: string;
    settingsJson: string;
  }>
): Promise<string> {
  const id = overrides?.id ?? `tenant_${randomId()}`;
  const now = Date.now();
  await db("tenant").insert({
    id,
    subdomain: overrides?.subdomain ?? `test-${randomId()}`,
    name: overrides?.name ?? "Test Org",
    description: "",
    settings_json: overrides?.settingsJson ?? "{}",
    active: 1,
    created_at: now,
    updated_at: now,
  });
  return id;
}

async function getTenantHostHeader(db: Knex, tenantId: string, serverBaseUrl: string): Promise<string> {
  const row = await db("tenant").select("subdomain").where({ id: tenantId }).first();
  const subdomain = row?.subdomain as string | undefined;
  if (!subdomain) {
    throw new Error(`Tenant ${tenantId} not found while constructing test client host header`);
  }
  const port = new URL(serverBaseUrl).port;
  return port === "" ? `${subdomain}.test.local` : `${subdomain}.test.local:${port}`;
}

/**
 * Seed a user directly into the database and return { userId, email, apiKey, client }.
 * Also creates an API key so the user can authenticate.
 */
export async function seedUser(
  db: Knex,
  tenantId: string,
  overrides?: Partial<{
    id: string;
    email: string;
    fullName: string;
    role: number;
    isBot: number;
    botType: number;
    botOwnerId: string;
  }>
): Promise<{
  userId: string;
  email: string;
  apiKey: string;
  client: ApiClient;
}> {
  const userId = overrides?.id ?? `user_${randomId()}`;
  const email = overrides?.email ?? `user-${randomId()}@test.local`;
  const now = Date.now();

  await db("user").insert({
    id: userId,
    tenant_id: tenantId,
    email,
    full_name: overrides?.fullName ?? "Test User",
    role: overrides?.role ?? 400,
    avatar_source: "gravatar",
    is_bot: overrides?.isBot ?? 0,
    bot_type: overrides?.botType ?? null,
    bot_owner_id: overrides?.botOwnerId ?? null,
    is_active: 1,
    timezone: "",
    date_joined: now,
    is_billing_admin: 0,
    delivery_email: email,
    created_at: now,
    updated_at: now,
  });

  // Create an API key for the user
  const apiKey = randomId() + randomId();
  const keyHash = hashApiKey(apiKey);
  await db("api_key").insert({
    id: `key_${randomId()}`,
    tenant_id: tenantId,
    user_id: userId,
    key_hash: keyHash,
    created_at: now,
  });

  const serverBaseUrl = getServerBaseUrl();
  const hostHeader = await getTenantHostHeader(db, tenantId, serverBaseUrl);
  const client = createApiClient(serverBaseUrl, email, apiKey, hostHeader);
  return { userId, email, apiKey, client };
}

/**
 * Seed a channel directly into the database.
 */
export async function seedChannel(
  db: Knex,
  tenantId: string,
  overrides?: Partial<{
    id: string;
    name: string;
    isPrivate: number;
    isWebPublic: number;
    creatorId: string;
  }>
): Promise<string> {
  const id = overrides?.id ?? `ch_${randomId()}`;
  const now = Date.now();
  await db("channel").insert({
    id,
    tenant_id: tenantId,
    name: overrides?.name ?? `channel-${randomId()}`,
    description: "",
    rendered_description: "",
    is_private: overrides?.isPrivate ?? 0,
    is_web_public: overrides?.isWebPublic ?? 0,
    history_public_to_subscribers: 1,
    creator_id: overrides?.creatorId ?? null,
    is_archived: 0,
    created_at: now,
    updated_at: now,
  });
  return id;
}

/**
 * Seed a subscription directly into the database.
 */
export async function seedSubscription(
  db: Knex,
  tenantId: string,
  userId: string,
  channelId: string
): Promise<string> {
  const id = `sub_${randomId()}`;
  const now = Date.now();
  await db("subscription").insert({
    id,
    tenant_id: tenantId,
    user_id: userId,
    channel_id: channelId,
    color: "#c2c2c2",
    pin_to_top: 0,
    is_muted: 0,
    created_at: now,
  });
  return id;
}

/**
 * Seed a message directly into the database.
 */
export async function seedMessage(
  db: Knex,
  tenantId: string,
  senderId: string,
  overrides?: Partial<{
    id: string;
    channelId: string;
    topic: string;
    dmGroupId: string;
    content: string;
  }>
): Promise<string> {
  const id = overrides?.id ?? `msg_${randomId()}`;
  const now = Date.now();
  const type = overrides?.channelId ? "stream" : "private";
  await db("message").insert({
    id,
    tenant_id: tenantId,
    sender_id: senderId,
    type,
    channel_id: overrides?.channelId ?? null,
    topic: overrides?.topic ?? null,
    dm_group_id: overrides?.dmGroupId ?? null,
    content: overrides?.content ?? "Hello, world!",
    rendered_content: `<p>${overrides?.content ?? "Hello, world!"}</p>`,
    has_attachment: 0,
    has_image: 0,
    has_link: 0,
    created_at: now,
  });
  return id;
}

/**
 * Seed system groups for a tenant (the 8 role-based groups).
 */
export async function seedSystemGroups(
  db: Knex,
  tenantId: string
): Promise<Record<string, string>> {
  const groups: Record<string, string> = {};
  const now = Date.now();
  const systemGroupNames = [
    "role:everyone",
    "role:members",
    "role:fullmembers",
    "role:moderators",
    "role:administrators",
    "role:owners",
    "role:internet",
    "role:nobody",
  ];

  for (const name of systemGroupNames) {
    const id = `grp_${randomId()}`;
    groups[name] = id;
    await db("user_group").insert({
      id,
      tenant_id: tenantId,
      name,
      description: `System group: ${name}`,
      is_system_group: 1,
      is_active: 1,
      created_at: now,
      updated_at: now,
    });
  }

  return groups;
}

function randomId(): string {
  return crypto.randomBytes(8).toString("hex");
}

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}
