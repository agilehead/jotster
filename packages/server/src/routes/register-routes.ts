import { express } from "@tsonic/express/index.js";
import type { Application, Request, Response, NextFunction } from "@tsonic/express/index.js";
import type { AppContext } from "../helpers/app-context.ts";

// Auth handlers (Phase 1)
import { handleGetServerSettings } from "../handlers/handle-get-server-settings.ts";
import { handleFetchApiKey } from "../handlers/handle-fetch-api-key.ts";
import { handleDevFetchApiKey } from "../handlers/handle-dev-fetch-api-key.ts";
import { handleRegenerateApiKey } from "../handlers/handle-regenerate-api-key.ts";
import { handleCreateTenant } from "../handlers/handle-create-tenant.ts";
import { handleListTenants } from "../handlers/handle-list-tenants.ts";
import { handleUpdateTenant } from "../handlers/handle-update-tenant.ts";
import { handleDevListUsers, handleJwtFetchApiKey } from "../handlers/handle-auth-compat.ts";

// User handlers (Phase 2)
import { handleGetOwnProfile } from "../handlers/handle-get-own-profile.ts";
import { handleGetUsers } from "../handlers/handle-get-users.ts";
import { handleGetUser } from "../handlers/handle-get-user.ts";
import { handleCreateUser } from "../handlers/handle-create-user.ts";
import { handleUpdateUser } from "../handlers/handle-update-user.ts";
import { handleDeactivateUser } from "../handlers/handle-deactivate-user.ts";
import { handleDeactivateSelf } from "../handlers/handle-deactivate-self.ts";
import { handleReactivateUser } from "../handlers/handle-reactivate-user.ts";
import { handleUpdateSettings } from "../handlers/handle-update-settings.ts";
import { handleGetBots } from "../handlers/handle-get-bots.ts";
import { handleCreateBot } from "../handlers/handle-create-bot.ts";
import { handleUpdateBot } from "../handlers/handle-update-bot.ts";
import { handleDeactivateBot } from "../handlers/handle-deactivate-bot.ts";
import {
  handleGetBotApiKeyCompat,
  handleGetUserGroupMembersCompat,
  handleGetUserGroupMembershipCompat,
  handleGetUserGroupSubgroupsCompat,
  handleMutateUserGroupMembersCompat,
  handleMutateUserGroupSubgroupsCompat,
  handleRegenerateBotApiKeyCompat,
  handleSetTargetUserStatusCompat,
} from "../handlers/handle-user-compat.ts";

// Channel handlers (Phase 2)
import { handleGetStreams } from "../handlers/handle-get-streams.ts";
import { handleCreateChannel } from "../handlers/handle-create-channel.ts";
import { handleGetStream } from "../handlers/handle-get-stream.ts";
import { handleUpdateStream } from "../handlers/handle-update-stream.ts";
import { handleArchiveStream } from "../handlers/handle-archive-stream.ts";
import { handleGetStreamId } from "../handlers/handle-get-stream-id.ts";
import { handleGetTopics } from "../handlers/handle-get-topics.ts";
import { handleGetStreamMembers } from "../handlers/handle-get-stream-members.ts";
import { handleAddDefaultStream } from "../handlers/handle-add-default-stream.ts";
import { handleRemoveDefaultStream } from "../handlers/handle-remove-default-stream.ts";

// Channel folder handlers
import { handleGetChannelFolders } from "../handlers/handle-get-channel-folders.ts";
import { handleCreateChannelFolder } from "../handlers/handle-create-channel-folder.ts";
import { handleUpdateChannelFolder } from "../handlers/handle-update-channel-folder.ts";
import { handleDeleteChannelFolder } from "../handlers/handle-delete-channel-folder.ts";
import {
  handleCreateChannelFolderCompat,
  handleDeleteTopicCompat,
  handleGetStreamEmailAddressCompat,
  handleReorderChannelFoldersCompat,
} from "../handlers/handle-channel-compat.ts";

// Subscription handlers (Phase 2)
import { handleGetSubscriptions } from "../handlers/handle-get-subscriptions.ts";
import { handleSubscribe } from "../handlers/handle-subscribe.ts";
import { handleUnsubscribe } from "../handlers/handle-unsubscribe.ts";
import { handleCheckSubscribed } from "../handlers/handle-check-subscribed.ts";
import { handleBulkSubscriptions } from "../handlers/handle-bulk-subscriptions.ts";
import { handleUpdateSubscription } from "../handlers/handle-update-subscription.ts";
import { handleUpdateSubscriptionProperties } from "../handlers/handle-update-subscription-properties.ts";
import { handleGetUserChannels } from "../handlers/handle-get-user-channels.ts";

// Event queue handlers (Phase 3)
import { handleRegisterQueue } from "../handlers/handle-register-queue.ts";
import { handleGetEvents } from "../handlers/handle-get-events.ts";
import { handleDeleteQueue } from "../handlers/handle-delete-queue.ts";

// Message handlers (Phase 4)
import { handleSendMessage } from "../handlers/handle-send-message.ts";
import { handleGetMessages } from "../handlers/handle-get-messages.ts";
import { handleGetSingleMessage } from "../handlers/handle-get-single-message.ts";
import { handleEditMessage } from "../handlers/handle-edit-message.ts";
import { handleDeleteMessage } from "../handlers/handle-delete-message.ts";
import { handleGetMessageHistory } from "../handlers/handle-get-message-history.ts";
import { handleGetReadReceipts } from "../handlers/handle-get-read-receipts.ts";
import { handleRenderMessage } from "../handlers/handle-render-message.ts";
import { handleUpdateMessageFlags } from "../handlers/handle-update-message-flags.ts";
import { handleMarkAllAsRead } from "../handlers/handle-mark-all-as-read.ts";
import { handleAddReaction } from "../handlers/handle-add-reaction.ts";
import { handleRemoveReaction } from "../handlers/handle-remove-reaction.ts";
import {
  handleMarkStreamAsReadCompat,
  handleMarkTopicAsReadCompat,
  handleMessageEditTypingCompat,
  handleMessagesMatchNarrowCompat,
  handleReportMessageCompat,
  handleThumbnailStatusCompat,
  handleUpdateMessageFlagsForNarrowCompat,
} from "../handlers/handle-message-compat.ts";

// Custom Emoji handlers
import { handleGetCustomEmojis } from "../handlers/handle-get-custom-emojis.ts";
import { handleUploadCustomEmoji } from "../handlers/handle-upload-custom-emoji.ts";
import { handleDeactivateCustomEmoji } from "../handlers/handle-deactivate-custom-emoji.ts";

// Draft handlers (Phase 6)
import { handleGetDrafts } from "../handlers/handle-get-drafts.ts";
import { handleCreateDrafts } from "../handlers/handle-create-drafts.ts";
import { handleUpdateDraft } from "../handlers/handle-update-draft.ts";
import { handleDeleteDraft } from "../handlers/handle-delete-draft.ts";

// Custom Profile Fields handlers
import { handleGetCustomProfileFields } from "../handlers/handle-get-custom-profile-fields.ts";
import { handleCreateCustomProfileField } from "../handlers/handle-create-custom-profile-field.ts";
import { handleUpdateCustomProfileField } from "../handlers/handle-update-custom-profile-field.ts";
import { handleDeleteCustomProfileField } from "../handlers/handle-delete-custom-profile-field.ts";
import { handleUpdateProfileData } from "../handlers/handle-update-profile-data.ts";

// Presence, typing, status, muting handlers (Phase 5)
import { handleUpdatePresence } from "../handlers/handle-update-presence.ts";
import { handleGetUserPresence } from "../handlers/handle-get-user-presence.ts";
import { handleGetRealmPresence } from "../handlers/handle-get-realm-presence.ts";
import { handleSetUserStatus } from "../handlers/handle-set-user-status.ts";
import { handleGetUserStatus } from "../handlers/handle-get-user-status.ts";
import { handleMuteUser } from "../handlers/handle-mute-user.ts";
import { handleUnmuteUser } from "../handlers/handle-unmute-user.ts";
import { handleSetTopicVisibility } from "../handlers/handle-set-topic-visibility.ts";
import { handleLegacyMuteTopic } from "../handlers/handle-legacy-mute-topic.ts";
import { handleSendTyping } from "../handlers/handle-send-typing.ts";

// Notification handlers (Alert Words)
import { handleGetAlertWords } from "../handlers/handle-get-alert-words.ts";
import { handleAddAlertWords } from "../handlers/handle-add-alert-words.ts";
import { handleRemoveAlertWords } from "../handlers/handle-remove-alert-words.ts";

// Push notification handlers
import { handleRegisterAndroidToken } from "../handlers/handle-register-android-token.ts";
import { handleUnregisterAndroidToken } from "../handlers/handle-unregister-android-token.ts";
import { handleRegisterApnsToken } from "../handlers/handle-register-apns-token.ts";
import { handleUnregisterApnsToken } from "../handlers/handle-unregister-apns-token.ts";
import { handleTestNotification } from "../handlers/handle-test-notification.ts";
import { handleRegisterPushDevice } from "../handlers/handle-register-push-device.ts";
import { handleTestE2eeNotification } from "../handlers/handle-test-e2ee-notification.ts";
import {
  handleRegisterClientDeviceCompat,
  handleRegisterRemotePushDeviceCompat,
  handleRemoveClientDeviceCompat,
} from "../handlers/handle-mobile-compat.ts";

// User group handlers
import { handleGetUserGroups } from "../handlers/handle-get-user-groups.ts";
import { handleCreateUserGroup } from "../handlers/handle-create-user-group.ts";
import { handleUpdateUserGroup } from "../handlers/handle-update-user-group.ts";
import { handleDeactivateUserGroup } from "../handlers/handle-deactivate-user-group.ts";
import { handleAddUserGroupMembers } from "../handlers/handle-add-user-group-members.ts";
import { handleRemoveUserGroupMembers } from "../handlers/handle-remove-user-group-members.ts";
import { handleAddUserGroupSubgroups } from "../handlers/handle-add-user-group-subgroups.ts";
import { handleRemoveUserGroupSubgroups } from "../handlers/handle-remove-user-group-subgroups.ts";

// Upload/Attachment handlers
import { handleUploadFile } from "../handlers/handle-upload-file.ts";
import { handleServeFile } from "../handlers/handle-serve-file.ts";
import { handleGetAttachments } from "../handlers/handle-get-attachments.ts";
import { handleDeleteAttachment } from "../handlers/handle-delete-attachment.ts";

// Webhook handlers (Phase 7C)
import { handleIncomingWebhook } from "../handlers/handle-incoming-webhook.ts";
import { handleSlackIncomingWebhook } from "../handlers/handle-slack-incoming-webhook.ts";
import { handleGetBotStorage } from "../handlers/handle-get-bot-storage.ts";
import { handleSetBotStorage } from "../handlers/handle-set-bot-storage.ts";
import { handleDeleteBotStorage } from "../handlers/handle-delete-bot-storage.ts";
import { handleSubmessage } from "../handlers/handle-submessage.ts";

// Organization settings handlers (Phase 7A)
import { handleUpdateRealm } from "../handlers/handle-update-realm.ts";
import { handleGetRealmDomains } from "../handlers/handle-get-realm-domains.ts";
import { handleAddRealmDomain } from "../handlers/handle-add-realm-domain.ts";
import { handleUpdateRealmDomain } from "../handlers/handle-update-realm-domain.ts";
import { handleRemoveRealmDomain } from "../handlers/handle-remove-realm-domain.ts";
import { handleUpdateUserSettingDefaults } from "../handlers/handle-update-user-setting-defaults.ts";
import { handleGetRealmIcon } from "../handlers/handle-get-realm-icon.ts";
import { handleUploadRealmIcon } from "../handlers/handle-upload-realm-icon.ts";
import { handleDeleteRealmIcon } from "../handlers/handle-delete-realm-icon.ts";
import { handleGetRealmLogo } from "../handlers/handle-get-realm-logo.ts";
import { handleUploadRealmLogo } from "../handlers/handle-upload-realm-logo.ts";
import { handleDeleteRealmLogo } from "../handlers/handle-delete-realm-logo.ts";
import { handleDeactivateRealm } from "../handlers/handle-deactivate-realm.ts";
import {
  handleCreateLinkifierCompat,
  handleDeleteLinkifierCompat,
  handleGetLinkifiersCompat,
  handleReorderLinkifiersCompat,
  handleReorderProfileFieldsCompat,
  handleTestWelcomeBotCustomMessageCompat,
  handleUpdateLinkifierCompat,
} from "../handlers/handle-organization-compat.ts";

// Data Export handlers (Phase 8A)
import { handleGetExports } from "../handlers/handle-get-exports.ts";
import { handleCreateExport } from "../handlers/handle-create-export.ts";
import { handleDeleteExport } from "../handlers/handle-delete-export.ts";
import { handleGetExportConsents } from "../handlers/handle-get-export-consents.ts";

// Invitation handlers (Phase 7B)
import { handleGetInvites } from "../handlers/handle-get-invites.ts";
import { handleSendInvites } from "../handlers/handle-send-invites.ts";
import { handleCreateMultiuseInvite } from "../handlers/handle-create-multiuse-invite.ts";
import { handleResendInvite } from "../handlers/handle-resend-invite.ts";
import { handleRevokeInvite } from "../handlers/handle-revoke-invite.ts";
import { handleRevokeMultiuseInvite } from "../handlers/handle-revoke-multiuse-invite.ts";
import {
  handleCreateNavigationViewCompat,
  handleCreateReminderCompat,
  handleCreateSavedSnippetCompat,
  handleCreateScheduledMessageCompat,
  handleDeleteNavigationViewCompat,
  handleDeleteReminderCompat,
  handleDeleteSavedSnippetCompat,
  handleDeleteScheduledMessageCompat,
  handleGetNavigationViewsCompat,
  handleGetRemindersCompat,
  handleGetSavedSnippetsCompat,
  handleGetScheduledMessagesCompat,
  handleUpdateNavigationViewCompat,
  handleUpdateSavedSnippetCompat,
  handleUpdateScheduledMessageCompat,
} from "../handlers/handle-persisted-compat.ts";
import {
  handleRealTimeCompat,
  handleRestErrorHandlingCompat,
  handleZulipOutgoingWebhookCompat,
} from "../handlers/handle-docs-compat.ts";

export const registerRoutes = (app: Application, ctx: AppContext): void => {
  // --- Auth & Server ---
  app.get("/api/v1/server_settings", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetServerSettings(req, res, ctx);
  });

  app.post("/api/v1/fetch_api_key", async (req: Request, res: Response, _next: NextFunction) => {
    await handleFetchApiKey(req, res, ctx);
  });

  app.post("/api/v1/dev_fetch_api_key", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDevFetchApiKey(req, res, ctx);
  });

  app.post("/api/v1/jwt/fetch_api_key", async (req: Request, res: Response, _next: NextFunction) => {
    await handleJwtFetchApiKey(req, res, ctx);
  });

  app.get("/api/v1/dev_list_users", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDevListUsers(req, res, ctx);
  });

  // --- Users (specific paths before parameterized) ---
  app.get("/api/v1/users/me", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetOwnProfile(req, res, ctx);
  });

  app.delete("/api/v1/users/me", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeactivateSelf(req, res, ctx);
  });

  app.post("/api/v1/users/me/api_key/regenerate", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRegenerateApiKey(req, res, ctx);
  });

  app.post("/api/v1/users/me/presence", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdatePresence(req, res, ctx);
  });

  app.post("/api/v1/users/me/status", async (req: Request, res: Response, _next: NextFunction) => {
    await handleSetUserStatus(req, res, ctx);
  });

  app.post("/api/v1/users/me/muted_users/:muted_user_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleMuteUser(req, res, ctx);
  });

  app.delete("/api/v1/users/me/muted_users/:muted_user_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUnmuteUser(req, res, ctx);
  });

  app.get("/api/v1/users/me/alert_words", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetAlertWords(req, res, ctx);
  });

  app.post("/api/v1/users/me/alert_words", async (req: Request, res: Response, _next: NextFunction) => {
    await handleAddAlertWords(req, res, ctx);
  });

  app.delete("/api/v1/users/me/alert_words", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRemoveAlertWords(req, res, ctx);
  });

  app.post("/api/v1/users/me/android_gcm_reg_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRegisterAndroidToken(req, res, ctx);
  });

  app.delete("/api/v1/users/me/android_gcm_reg_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUnregisterAndroidToken(req, res, ctx);
  });

  app.post("/api/v1/users/me/apns_device_token", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRegisterApnsToken(req, res, ctx);
  });

  app.delete("/api/v1/users/me/apns_device_token", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUnregisterApnsToken(req, res, ctx);
  });

  app.get("/api/v1/users/me/subscriptions", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetSubscriptions(req, res, ctx);
  });

  app.post("/api/v1/users/me/subscriptions/properties", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateSubscriptionProperties(req, res, ctx);
  });

  app.patch("/api/v1/users/me/subscriptions/muted_topics", async (req: Request, res: Response, _next: NextFunction) => {
    await handleLegacyMuteTopic(req, res, ctx);
  });

  app.post("/api/v1/users/me/subscriptions", async (req: Request, res: Response, _next: NextFunction) => {
    await handleSubscribe(req, res, ctx);
  });

  app.delete("/api/v1/users/me/subscriptions", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUnsubscribe(req, res, ctx);
  });

  app.patch("/api/v1/users/me/subscriptions/:stream_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateSubscription(req, res, ctx);
  });

  app.patch("/api/v1/users/me/subscriptions", async (req: Request, res: Response, _next: NextFunction) => {
    await handleBulkSubscriptions(req, res, ctx);
  });

  app.patch("/api/v1/users/me/profile_data", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateProfileData(req, res, ctx);
  });

  app.get("/api/v1/users/me/:stream_id/topics", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetTopics(req, res, ctx);
  });

  app.get("/api/v1/users", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetUsers(req, res, ctx);
  });

  app.post("/api/v1/users", async (req: Request, res: Response, _next: NextFunction) => {
    await handleCreateUser(req, res, ctx);
  });

  app.post("/api/v1/users/:user_id/reactivate", async (req: Request, res: Response, _next: NextFunction) => {
    await handleReactivateUser(req, res, ctx);
  });

  app.get("/api/v1/users/:user_id/subscriptions/:stream_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleCheckSubscribed(req, res, ctx);
  });

  app.get("/api/v1/users/:user_id/channels", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetUserChannels(req, res, ctx);
  });

  app.get("/api/v1/users/:user_id_or_email/presence", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetUserPresence(req, res, ctx);
  });

  app.get("/api/v1/users/:user_id/status", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetUserStatus(req, res, ctx);
  });

  app.post("/api/v1/users/:user_id/status", async (req: Request, res: Response, _next: NextFunction) => {
    await handleSetTargetUserStatusCompat(req, res, ctx);
  });

  app.get("/api/v1/users/:user_id_or_email", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetUser(req, res, ctx);
  });

  app.patch("/api/v1/users/:user_id_or_email", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateUser(req, res, ctx);
  });

  app.delete("/api/v1/users/:user_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeactivateUser(req, res, ctx);
  });

  // --- Settings ---
  app.patch("/api/v1/settings", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateSettings(req, res, ctx);
  });

  // --- Bots ---
  app.get("/api/v1/bots", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetBots(req, res, ctx);
  });

  app.post("/api/v1/bots", async (req: Request, res: Response, _next: NextFunction) => {
    await handleCreateBot(req, res, ctx);
  });

  app.patch("/api/v1/bots/:bot_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateBot(req, res, ctx);
  });

  app.delete("/api/v1/bots/:bot_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeactivateBot(req, res, ctx);
  });

  app.get("/api/v1/bots/:bot_id/api_key", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetBotApiKeyCompat(req, res, ctx);
  });

  app.post("/api/v1/bots/:bot_id/api_key/regenerate", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRegenerateBotApiKeyCompat(req, res, ctx);
  });

  // --- Channels/Streams ---
  app.get("/api/v1/streams", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetStreams(req, res, ctx);
  });

  app.post("/api/v1/channels/create", async (req: Request, res: Response, _next: NextFunction) => {
    await handleCreateChannel(req, res, ctx);
  });

  app.get("/api/v1/get_stream_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetStreamId(req, res, ctx);
  });

  app.post("/api/v1/default_streams", async (req: Request, res: Response, _next: NextFunction) => {
    await handleAddDefaultStream(req, res, ctx);
  });

  app.delete("/api/v1/default_streams", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRemoveDefaultStream(req, res, ctx);
  });

  app.get("/api/v1/streams/:stream_id/members", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetStreamMembers(req, res, ctx);
  });

  app.get("/api/v1/streams/:stream_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetStream(req, res, ctx);
  });

  app.patch("/api/v1/streams/:stream_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateStream(req, res, ctx);
  });

  app.delete("/api/v1/streams/:stream_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleArchiveStream(req, res, ctx);
  });

  app.get("/api/v1/streams/:stream_id/email_address", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetStreamEmailAddressCompat(req, res, ctx);
  });

  app.post("/api/v1/streams/:stream_id/delete_topic", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteTopicCompat(req, res, ctx);
  });

  // --- Channel Folders ---
  app.get("/api/v1/channel_folders", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetChannelFolders(req, res, ctx);
  });

  app.post("/api/v1/channel_folders", async (req: Request, res: Response, _next: NextFunction) => {
    await handleCreateChannelFolder(req, res, ctx);
  });

  app.post("/api/v1/channel_folders/create", async (req: Request, res: Response, _next: NextFunction) => {
    await handleCreateChannelFolderCompat(req, res, ctx);
  });

  app.patch("/api/v1/channel_folders", async (req: Request, res: Response, _next: NextFunction) => {
    await handleReorderChannelFoldersCompat(req, res, ctx);
  });

  app.patch("/api/v1/channel_folders/:folder_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateChannelFolder(req, res, ctx);
  });

  app.delete("/api/v1/channel_folders/:folder_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteChannelFolder(req, res, ctx);
  });

  // --- Event Queue ---
  app.post("/api/v1/register", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRegisterQueue(req, res, ctx);
  });

  app.get("/api/v1/events", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetEvents(req, res, ctx);
  });

  app.delete("/api/v1/events", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteQueue(req, res, ctx);
  });

  // --- Messages (specific paths before parameterized) ---
  app.post("/api/v1/messages/render", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRenderMessage(req, res, ctx);
  });

  app.post("/api/v1/messages/flags", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateMessageFlags(req, res, ctx);
  });

  app.post("/api/v1/messages/flags/narrow", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateMessageFlagsForNarrowCompat(req, res, ctx);
  });

  app.post("/api/v1/mark_all_as_read", async (req: Request, res: Response, _next: NextFunction) => {
    await handleMarkAllAsRead(req, res, ctx);
  });

  app.post("/api/v1/mark_stream_as_read", async (req: Request, res: Response, _next: NextFunction) => {
    await handleMarkStreamAsReadCompat(req, res, ctx);
  });

  app.post("/api/v1/mark_topic_as_read", async (req: Request, res: Response, _next: NextFunction) => {
    await handleMarkTopicAsReadCompat(req, res, ctx);
  });

  app.get("/api/v1/messages/matches_narrow", async (req: Request, res: Response, _next: NextFunction) => {
    await handleMessagesMatchNarrowCompat(req, res, ctx);
  });

  app.get("/api/v1/messages/:message_id/history", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetMessageHistory(req, res, ctx);
  });

  app.get("/api/v1/messages/:message_id/read_receipts", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetReadReceipts(req, res, ctx);
  });

  app.post("/api/v1/messages/:message_id/reactions", async (req: Request, res: Response, _next: NextFunction) => {
    await handleAddReaction(req, res, ctx);
  });

  app.delete("/api/v1/messages/:message_id/reactions", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRemoveReaction(req, res, ctx);
  });

  app.post("/api/v1/messages/:message_id/report", async (req: Request, res: Response, _next: NextFunction) => {
    await handleReportMessageCompat(req, res, ctx);
  });

  app.post("/api/v1/messages/:message_id/typing", async (req: Request, res: Response, _next: NextFunction) => {
    await handleMessageEditTypingCompat(req, res, ctx);
  });

  app.get("/api/v1/messages", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetMessages(req, res, ctx);
  });

  app.post("/api/v1/messages", async (req: Request, res: Response, _next: NextFunction) => {
    await handleSendMessage(req, res, ctx);
  });

  app.get("/api/v1/messages/:message_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetSingleMessage(req, res, ctx);
  });

  app.patch("/api/v1/messages/:message_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleEditMessage(req, res, ctx);
  });

  app.delete("/api/v1/messages/:message_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteMessage(req, res, ctx);
  });

  // --- Custom Profile Fields ---
  app.get("/api/v1/realm/profile_fields", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetCustomProfileFields(req, res, ctx);
  });

  app.post("/api/v1/realm/profile_fields", async (req: Request, res: Response, _next: NextFunction) => {
    await handleCreateCustomProfileField(req, res, ctx);
  });

  app.patch("/api/v1/realm/profile_fields/:field_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateCustomProfileField(req, res, ctx);
  });

  app.delete("/api/v1/realm/profile_fields/:field_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteCustomProfileField(req, res, ctx);
  });

  app.patch("/api/v1/realm/profile_fields", async (req: Request, res: Response, _next: NextFunction) => {
    await handleReorderProfileFieldsCompat(req, res, ctx);
  });

  // Multipart middleware (used by upload/image endpoints)
  const upload = express.multipart();

  // --- Custom Emoji ---
  app.get("/api/v1/realm/emoji", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetCustomEmojis(req, res, ctx);
  });

  app.post("/api/v1/realm/emoji/:emoji_name", upload.fields([{ name: "filename" }, { name: "file" }]), async (req: Request, res: Response, _next: NextFunction) => {
    await handleUploadCustomEmoji(req, res, ctx);
  });

  app.delete("/api/v1/realm/emoji/:emoji_name", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeactivateCustomEmoji(req, res, ctx);
  });

  // --- Organization Settings ---
  app.patch("/api/v1/realm", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateRealm(req, res, ctx);
  });

  app.patch("/api/v1/realm/user_settings_defaults", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateUserSettingDefaults(req, res, ctx);
  });

  app.post("/api/v1/realm/deactivate", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeactivateRealm(req, res, ctx);
  });

  app.get("/api/v1/realm/linkifiers", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetLinkifiersCompat(req, res, ctx);
  });

  app.patch("/api/v1/realm/linkifiers", async (req: Request, res: Response, _next: NextFunction) => {
    await handleReorderLinkifiersCompat(req, res, ctx);
  });

  app.post("/api/v1/realm/filters", async (req: Request, res: Response, _next: NextFunction) => {
    await handleCreateLinkifierCompat(req, res, ctx);
  });

  app.patch("/api/v1/realm/filters/:filter_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateLinkifierCompat(req, res, ctx);
  });

  app.delete("/api/v1/realm/filters/:filter_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteLinkifierCompat(req, res, ctx);
  });

  app.post("/api/v1/realm/test_welcome_bot_custom_message", async (req: Request, res: Response, _next: NextFunction) => {
    await handleTestWelcomeBotCustomMessageCompat(req, res, ctx);
  });

  app.get("/api/v1/realm/domains", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetRealmDomains(req, res, ctx);
  });

  app.post("/api/v1/realm/domains", async (req: Request, res: Response, _next: NextFunction) => {
    await handleAddRealmDomain(req, res, ctx);
  });

  app.patch("/api/v1/realm/domains/:domain", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateRealmDomain(req, res, ctx);
  });

  app.delete("/api/v1/realm/domains/:domain", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRemoveRealmDomain(req, res, ctx);
  });

  app.get("/api/v1/realm/icon", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetRealmIcon(req, res, ctx);
  });

  app.post("/api/v1/realm/icon", upload.single("file"), async (req: Request, res: Response, _next: NextFunction) => {
    await handleUploadRealmIcon(req, res, ctx);
  });

  app.delete("/api/v1/realm/icon", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteRealmIcon(req, res, ctx);
  });

  app.get("/api/v1/realm/logo", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetRealmLogo(req, res, ctx);
  });

  app.post("/api/v1/realm/logo", upload.single("file"), async (req: Request, res: Response, _next: NextFunction) => {
    await handleUploadRealmLogo(req, res, ctx);
  });

  app.delete("/api/v1/realm/logo", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteRealmLogo(req, res, ctx);
  });

  // --- Invitations ---
  app.get("/api/v1/invites", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetInvites(req, res, ctx);
  });

  app.post("/api/v1/invites", async (req: Request, res: Response, _next: NextFunction) => {
    await handleSendInvites(req, res, ctx);
  });

  app.post("/api/v1/invites/multiuse", async (req: Request, res: Response, _next: NextFunction) => {
    await handleCreateMultiuseInvite(req, res, ctx);
  });

  app.post("/api/v1/invites/:invite_id/resend", async (req: Request, res: Response, _next: NextFunction) => {
    await handleResendInvite(req, res, ctx);
  });

  app.delete("/api/v1/invites/multiuse/:invite_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRevokeMultiuseInvite(req, res, ctx);
  });

  app.delete("/api/v1/invites/:invite_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRevokeInvite(req, res, ctx);
  });

  // --- Drafts ---
  app.get("/api/v1/drafts", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetDrafts(req, res, ctx);
  });

  app.post("/api/v1/drafts", async (req: Request, res: Response, _next: NextFunction) => {
    await handleCreateDrafts(req, res, ctx);
  });

  app.patch("/api/v1/drafts/:draft_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateDraft(req, res, ctx);
  });

  app.delete("/api/v1/drafts/:draft_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteDraft(req, res, ctx);
  });

  // --- Presence & Typing ---
  app.get("/api/v1/realm/presence", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetRealmPresence(req, res, ctx);
  });

  app.post("/api/v1/user_topics", async (req: Request, res: Response, _next: NextFunction) => {
    await handleSetTopicVisibility(req, res, ctx);
  });

  app.post("/api/v1/typing", async (req: Request, res: Response, _next: NextFunction) => {
    await handleSendTyping(req, res, ctx);
  });

  app.post("/api/v1/register_client_device", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRegisterClientDeviceCompat(req, res, ctx);
  });

  app.post("/api/v1/remove_client_device", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRemoveClientDeviceCompat(req, res, ctx);
  });

  // --- Mobile Push ---
  app.post("/api/v1/mobile_push/test_notification", async (req: Request, res: Response, _next: NextFunction) => {
    await handleTestNotification(req, res, ctx);
  });

  app.post("/api/v1/mobile_push/register", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRegisterPushDevice(req, res, ctx);
  });

  app.post("/api/v1/mobile_push/e2ee/test_notification", async (req: Request, res: Response, _next: NextFunction) => {
    await handleTestE2eeNotification(req, res, ctx);
  });

  app.post("/api/v1/remotes/push/e2ee/register", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRegisterRemotePushDeviceCompat(req, res, ctx);
  });

  // --- User Groups ---
  app.get("/api/v1/user_groups", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetUserGroups(req, res, ctx);
  });

  app.post("/api/v1/user_groups/create", async (req: Request, res: Response, _next: NextFunction) => {
    await handleCreateUserGroup(req, res, ctx);
  });

  app.post("/api/v1/user_groups/:group_id/deactivate", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeactivateUserGroup(req, res, ctx);
  });

  app.get("/api/v1/user_groups/:group_id/members", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetUserGroupMembersCompat(req, res, ctx);
  });

  app.get("/api/v1/user_groups/:group_id/members/:user_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetUserGroupMembershipCompat(req, res, ctx);
  });

  app.post("/api/v1/user_groups/:group_id/members", async (req: Request, res: Response, _next: NextFunction) => {
    await handleMutateUserGroupMembersCompat(req, res, ctx);
  });

  app.delete("/api/v1/user_groups/:group_id/members", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRemoveUserGroupMembers(req, res, ctx);
  });

  app.get("/api/v1/user_groups/:group_id/subgroups", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetUserGroupSubgroupsCompat(req, res, ctx);
  });

  app.post("/api/v1/user_groups/:group_id/subgroups", async (req: Request, res: Response, _next: NextFunction) => {
    await handleMutateUserGroupSubgroupsCompat(req, res, ctx);
  });

  app.delete("/api/v1/user_groups/:group_id/subgroups", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRemoveUserGroupSubgroups(req, res, ctx);
  });

  app.patch("/api/v1/user_groups/:group_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateUserGroup(req, res, ctx);
  });

  // --- Uploads/Attachments ---
  app.post("/api/v1/user_uploads", upload.fields([{ name: "filename" }, { name: "file" }]), async (req: Request, res: Response, _next: NextFunction) => {
    await handleUploadFile(req, res, ctx);
  });

  app.get("/thumbnail/status/:realm_id_str/*", async (req: Request, res: Response, _next: NextFunction) => {
    await handleThumbnailStatusCompat(req, res, ctx);
  });

  app.get("/thumbnail/status/:realm_id_str/:path_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleThumbnailStatusCompat(req, res, ctx);
  });

  app.get("/user_uploads/:tenant_id/emoji/:emoji_id/:filename", async (req: Request, res: Response, _next: NextFunction) => {
    await handleServeFile(req, res, ctx);
  });

  app.get("/user_uploads/:tenant_id/:path_id/:filename", async (req: Request, res: Response, _next: NextFunction) => {
    await handleServeFile(req, res, ctx);
  });

  app.get("/user_uploads/:tenant_id/*", async (req: Request, res: Response, _next: NextFunction) => {
    await handleServeFile(req, res, ctx);
  });

  app.get("/user_uploads/:tenant_id/:path_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleServeFile(req, res, ctx);
  });

  app.get("/api/v1/attachments", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetAttachments(req, res, ctx);
  });

  app.delete("/api/v1/attachments/:attachment_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteAttachment(req, res, ctx);
  });

  // --- Webhooks ---
  app.post("/api/v1/external/slack_incoming", async (req: Request, res: Response, _next: NextFunction) => {
    await handleSlackIncomingWebhook(req, res, ctx);
  });

  app.post("/api/v1/external/:integration_name", async (req: Request, res: Response, _next: NextFunction) => {
    await handleIncomingWebhook(req, res, ctx);
  });

  app.get("/api/v1/bot_storage", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetBotStorage(req, res, ctx);
  });

  app.put("/api/v1/bot_storage", async (req: Request, res: Response, _next: NextFunction) => {
    await handleSetBotStorage(req, res, ctx);
  });

  app.delete("/api/v1/bot_storage", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteBotStorage(req, res, ctx);
  });

  app.post("/api/v1/submessage", async (req: Request, res: Response, _next: NextFunction) => {
    await handleSubmessage(req, res, ctx);
  });

  app.post("/api/v1/zulip-outgoing-webhook", async (req: Request, res: Response, _next: NextFunction) => {
    await handleZulipOutgoingWebhookCompat(req, res, ctx);
  });

  // --- Data Export ---
  app.get("/api/v1/export/realm/consents", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetExportConsents(req, res, ctx);
  });

  app.get("/api/v1/export/realm", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetExports(req, res, ctx);
  });

  app.post("/api/v1/export/realm", async (req: Request, res: Response, _next: NextFunction) => {
    await handleCreateExport(req, res, ctx);
  });

  app.delete("/api/v1/export/realm/:export_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteExport(req, res, ctx);
  });

  app.get("/api/v1/navigation_views", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetNavigationViewsCompat(req, res, ctx);
  });

  app.post("/api/v1/navigation_views", async (req: Request, res: Response, _next: NextFunction) => {
    await handleCreateNavigationViewCompat(req, res, ctx);
  });

  app.patch("/api/v1/navigation_views/*", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateNavigationViewCompat(req, res, ctx);
  });

  app.patch("/api/v1/navigation_views/:fragment_head/:fragment_tail/*", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateNavigationViewCompat(req, res, ctx);
  });

  app.patch("/api/v1/navigation_views/:fragment_head/:fragment_tail/:fragment_rest", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateNavigationViewCompat(req, res, ctx);
  });

  app.patch("/api/v1/navigation_views/:fragment_head/:fragment_tail", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateNavigationViewCompat(req, res, ctx);
  });

  app.delete("/api/v1/navigation_views/*", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteNavigationViewCompat(req, res, ctx);
  });

  app.delete("/api/v1/navigation_views/:fragment_head/:fragment_tail/*", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteNavigationViewCompat(req, res, ctx);
  });

  app.delete("/api/v1/navigation_views/:fragment_head/:fragment_tail/:fragment_rest", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteNavigationViewCompat(req, res, ctx);
  });

  app.delete("/api/v1/navigation_views/:fragment_head/:fragment_tail", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteNavigationViewCompat(req, res, ctx);
  });

  app.get("/api/v1/saved_snippets", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetSavedSnippetsCompat(req, res, ctx);
  });

  app.post("/api/v1/saved_snippets", async (req: Request, res: Response, _next: NextFunction) => {
    await handleCreateSavedSnippetCompat(req, res, ctx);
  });

  app.patch("/api/v1/saved_snippets/:saved_snippet_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateSavedSnippetCompat(req, res, ctx);
  });

  app.delete("/api/v1/saved_snippets/:saved_snippet_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteSavedSnippetCompat(req, res, ctx);
  });

  app.get("/api/v1/reminders", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetRemindersCompat(req, res, ctx);
  });

  app.post("/api/v1/reminders", async (req: Request, res: Response, _next: NextFunction) => {
    await handleCreateReminderCompat(req, res, ctx);
  });

  app.delete("/api/v1/reminders/:reminder_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteReminderCompat(req, res, ctx);
  });

  app.get("/api/v1/scheduled_messages", async (req: Request, res: Response, _next: NextFunction) => {
    await handleGetScheduledMessagesCompat(req, res, ctx);
  });

  app.post("/api/v1/scheduled_messages", async (req: Request, res: Response, _next: NextFunction) => {
    await handleCreateScheduledMessageCompat(req, res, ctx);
  });

  app.patch("/api/v1/scheduled_messages/:scheduled_message_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateScheduledMessageCompat(req, res, ctx);
  });

  app.delete("/api/v1/scheduled_messages/:scheduled_message_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleDeleteScheduledMessageCompat(req, res, ctx);
  });

  app.post("/api/v1/real-time", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRealTimeCompat(req, res, ctx);
  });

  app.post("/api/v1/rest-error-handling", async (req: Request, res: Response, _next: NextFunction) => {
    await handleRestErrorHandlingCompat(req, res, ctx);
  });

  // --- Internal Admin ---
  app.post("/internal/admin/tenants", async (req: Request, res: Response, _next: NextFunction) => {
    await handleCreateTenant(req, res, ctx);
  });

  app.get("/internal/admin/tenants", async (req: Request, res: Response, _next: NextFunction) => {
    await handleListTenants(req, res, ctx);
  });

  app.patch("/internal/admin/tenants/:tenant_id", async (req: Request, res: Response, _next: NextFunction) => {
    await handleUpdateTenant(req, res, ctx);
  });
};
