import type { Knex } from "knex";
import { createApiClient, type ApiClient } from "./api-client.js";
import crypto from "crypto";

function getServerBaseUrl(): string {
  return process.env.JOTSTER_TEST_BASE_URL ?? "http://localhost:9877";
}

/**
 * Seed a tenant directly into the database and return its auto-generated integer ID.
 */
export async function seedTenant(
  db: Knex,
  overrides?: Partial<{
    subdomain: string;
    name: string;
    description: string;
    iconUrl: string;
    settingsJson: string;
    ownerFullContentAccess: number;
  }>,
): Promise<number> {
  const now = Date.now();
  const [row] = await db("tenant")
    .insert({
      subdomain: overrides?.subdomain ?? `test-${randomId()}`,
      name: overrides?.name ?? "Test Org",
      description: overrides?.description ?? "",
      icon_url: overrides?.iconUrl ?? null,
      settings_json: overrides?.settingsJson ?? "{}",
      owner_full_content_access: overrides?.ownerFullContentAccess ?? 0,
      active: 1,
      created_at: now,
      updated_at: now,
    })
    .returning("id");
  const tenantId =
    typeof row === "object"
      ? ((row as Record<string, unknown>).id as number)
      : (row as number);

  // Always seed system groups for the new tenant
  await seedSystemGroups(db, tenantId);

  return tenantId;
}

async function getTenantHostHeader(
  db: Knex,
  tenantId: number,
  serverBaseUrl: string,
): Promise<string> {
  const row = await db("tenant")
    .select("subdomain")
    .where({ id: tenantId })
    .first();
  const subdomain = row?.subdomain as string | undefined;
  if (!subdomain) {
    throw new Error(
      `Tenant ${tenantId} not found while constructing test client host header`,
    );
  }
  const port = new URL(serverBaseUrl).port;
  return port === ""
    ? `${subdomain}.test.local`
    : `${subdomain}.test.local:${port}`;
}

/**
 * Seed a user directly into the database and return { userId, email, apiKey, client }.
 * Also creates an API key so the user can authenticate.
 */
export async function seedUser(
  db: Knex,
  tenantId: number,
  overrides?: Partial<{
    email: string;
    fullName: string;
    role: number;
    avatarUrl: string;
    timezone: string;
    isBot: number;
    botType: number;
    botOwnerId: number;
    isBillingAdmin: number;
  }>,
): Promise<{
  userId: number;
  email: string;
  apiKey: string;
  client: ApiClient;
}> {
  const email = overrides?.email ?? `user-${randomId()}@test.local`;
  const now = Date.now();

  const [row] = await db("user")
    .insert({
      tenant_id: tenantId,
      email,
      full_name: overrides?.fullName ?? "Test User",
      role: overrides?.role ?? 400,
      avatar_url: overrides?.avatarUrl ?? null,
      avatar_source: "gravatar",
      is_bot: overrides?.isBot ?? 0,
      bot_type: overrides?.botType ?? null,
      bot_owner_id: overrides?.botOwnerId ?? null,
      is_active: 1,
      timezone: overrides?.timezone ?? "UTC",
      date_joined: now,
      is_billing_admin: overrides?.isBillingAdmin ?? 0,
      delivery_email: email,
      created_at: now,
      updated_at: now,
    })
    .returning("id");
  const userId =
    typeof row === "object"
      ? ((row as Record<string, unknown>).id as number)
      : (row as number);

  await db("user_setting").insert({
    user_id: userId,
    tenant_id: tenantId,
    twenty_four_hour_time: 0,
    dense_mode: 0,
    web_font_size_px: 14,
    web_line_height_percent: 122,
    starred_message_counts: 1,
    fluid_layout_width: 0,
    high_contrast_mode: 0,
    color_scheme: 3,
    translate_emoticons: 1,
    display_emoji_reaction_users: 1,
    default_language: "en",
    default_view: "recent_topics",
    escape_navigates_to_default_view: 1,
    left_side_userlist: 0,
    emojiset: "google",
    demote_inactive_streams: 1,
    enable_stream_desktop_notifications: 0,
    enable_stream_email_notifications: 0,
    enable_stream_push_notifications: 0,
    enable_stream_audible_notifications: 0,
    notification_sound: "zulip",
    enable_desktop_notifications: 1,
    enable_sounds: 1,
    enable_offline_email_notifications: 1,
    enable_offline_push_notifications: 1,
    enable_online_push_notifications: 1,
    enable_followed_topic_desktop_notifications: 1,
    enable_followed_topic_email_notifications: 0,
    enable_followed_topic_push_notifications: 1,
    enable_followed_topic_audible_notifications: 0,
    email_notifications_batching_period_seconds: 120,
    enable_drafts_synchronization: 1,
    message_content_in_email_notifications: 1,
    pm_content_in_desktop_notifications: 1,
    wildcard_mentions_notify: 1,
    presence_enabled: 1,
    send_private_typing_notifications: 1,
    send_stream_typing_notifications: 1,
    send_read_receipts: 1,
    allow_private_data_export: 0,
    email_address_visibility: 1,
    realm_name_in_email_notifications_policy: 1,
    automatically_follow_topics_policy: 0,
    automatically_unmute_topics_in_muted_streams_policy: 0,
    automatically_follow_topics_where_mentioned: 1,
    user_list_style: 1,
    web_stream_unreads_count_display_policy: 1,
    web_navigate_to_sent_message: 1,
    web_channel_default_view: 1,
  });

  // Create an API key for the user
  const apiKey = randomId() + randomId();
  const keyHash = hashApiKey(apiKey);
  await db("api_key").insert({
    id: `key_${randomId()}`,
    tenant_id: tenantId,
    user_id: userId,
    key_hash: keyHash,
    raw_key: apiKey,
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
  tenantId: number,
  overrides?: Partial<{
    name: string;
    isPrivate: number;
    isWebPublic: number;
    creatorId: number;
  }>,
): Promise<number> {
  const now = Date.now();
  const [row] = await db("channel")
    .insert({
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
    })
    .returning("id");
  return typeof row === "object"
    ? ((row as Record<string, unknown>).id as number)
    : (row as number);
}

/**
 * Seed a subscription directly into the database.
 */
export async function seedSubscription(
  db: Knex,
  tenantId: number,
  userId: number,
  channelId: number,
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
  tenantId: number,
  senderId: number,
  overrides?: Partial<{
    channelId: number;
    topic: string;
    dmGroupId: string;
    content: string;
  }>,
): Promise<number> {
  const now = Date.now();
  const type = overrides?.channelId ? "stream" : "private";
  const [row] = await db("message")
    .insert({
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
    })
    .returning("id");
  return typeof row === "object"
    ? ((row as Record<string, unknown>).id as number)
    : (row as number);
}

/**
 * Seed system groups for a tenant (the 8 role-based groups).
 */
export async function seedSystemGroups(
  db: Knex,
  tenantId: number,
): Promise<Record<string, number>> {
  const groups: Record<string, number> = {};
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
    const [row] = await db("user_group")
      .insert({
        tenant_id: tenantId,
        name,
        description: `System group: ${name}`,
        is_system_group: 1,
        is_active: 1,
        created_at: now,
        updated_at: now,
      })
      .returning("id");
    groups[name] =
      typeof row === "object"
        ? ((row as Record<string, unknown>).id as number)
        : (row as number);
  }

  return groups;
}

function randomId(): string {
  return crypto.randomBytes(8).toString("hex");
}

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}
