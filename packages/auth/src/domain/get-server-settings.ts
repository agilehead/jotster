import {
  Tenant,
  ZULIP_VERSION,
  ZULIP_FEATURE_LEVEL,
} from "@jotster/core/Jotster.Core.js";

const escapeHtml = (value: string): string => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const renderRealmDescription = (value: string): string => {
  if (value.length === 0) {
    return "";
  }
  return `<p>${escapeHtml(value)}</p>`;
};

export const getServerSettings = (
  tenant: Tenant,
  realmUrl: string,
  devAuthEnabled: boolean,
): Record<string, unknown> => {
  return {
    zulip_feature_level: ZULIP_FEATURE_LEVEL,
    zulip_version: ZULIP_VERSION,
    zulip_merge_base: ZULIP_VERSION,
    push_notifications_enabled: false,
    is_incompatible: false,
    email_auth_enabled: true,
    require_email_format_usernames: true,
    authentication_methods: {
      password: true,
      dev: devAuthEnabled,
      email: true,
      ldap: false,
      remoteuser: false,
      github: false,
      azuread: false,
      gitlab: false,
      apple: false,
      google: false,
      saml: false,
      "openid connect": false,
    },
    external_authentication_methods: [],
    realm_name: tenant.Name,
    realm_description: renderRealmDescription(tenant.Description),
    realm_icon: tenant.IconUrl ?? "/static/images/logo/zulip-icon-circle.png",
    realm_uri: realmUrl,
    realm_url: realmUrl,
    realm_web_public_access_enabled: false,
  };
};
