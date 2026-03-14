import "./test-setup.js";
import "./tests/utils/api-client.test.js";

// Auth tests
import "./tests/auth/server-settings.test.js";
import "./tests/auth/fetch-api-key.test.js";
import "./tests/auth/tenant-management.test.js";

// User tests
import "./tests/users/create-user.test.js";
import "./tests/users/get-users.test.js";
import "./tests/users/update-user.test.js";
import "./tests/users/deactivate-user.test.js";

// Channel tests
import "./tests/channels/create-channel.test.js";
import "./tests/channels/get-channels.test.js";
import "./tests/channels/update-channel.test.js";

// Subscription tests
import "./tests/subscriptions/subscribe.test.js";
import "./tests/subscriptions/unsubscribe.test.js";
import "./tests/subscriptions/properties.test.js";

// Message tests
import "./tests/messages/send-message.test.js";
import "./tests/messages/get-messages.test.js";
import "./tests/messages/edit-delete-message.test.js";
import "./tests/messages/message-flags.test.js";
import "./tests/messages/reactions.test.js";

// Event queue tests
import "./tests/events/register-queue.test.js";
import "./tests/events/get-events.test.js";

// Presence, typing, status, muting tests
import "./tests/presence/presence.test.js";
import "./tests/presence/user-status.test.js";
import "./tests/presence/typing.test.js";
import "./tests/presence/muting.test.js";

// Drafts tests
import "./tests/drafts/drafts.test.js";

// Custom emoji tests
import "./tests/emoji/custom-emoji.test.js";

// Custom profile fields tests
import "./tests/profile/custom-profile-fields.test.js";

// Channel folder tests
import "./tests/channels/channel-folders.test.js";

// User group tests
import "./tests/users/user-groups.test.js";

// Alert word tests
import "./tests/users/alert-words.test.js";

// Organization settings tests
import "./tests/organization/org-settings.test.js";
import "./tests/organization/realm-domains.test.js";
import "./tests/organization/deactivate-realm.test.js";

// Invitation tests
import "./tests/invitations/invitations.test.js";

// Webhook tests
import "./tests/webhooks/incoming-webhook.test.js";
import "./tests/webhooks/bot-storage.test.js";

// Data export tests
import "./tests/export/data-export.test.js";

// Push notification tests
import "./tests/push/push-tokens.test.js";

// User settings tests
import "./tests/settings/user-settings.test.js";

// Upload/attachment tests
import "./tests/uploads/attachments.test.js";
