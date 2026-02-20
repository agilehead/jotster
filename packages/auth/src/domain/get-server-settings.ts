import {
  Tenant,
  ZULIP_VERSION,
  ZULIP_FEATURE_LEVEL,
} from "@jotster/core/Jotster.Core.js";

export const getServerSettings = (tenant: Tenant): Record<string, unknown> => {
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
      dev: true,
      email: false,
      ldap: false,
      remoteuser: false,
      github: false,
      google: false,
      saml: false,
      "openid connect": false,
    },
    external_authentication_methods: [],
    realm_name: tenant.Name,
    realm_description: tenant.Description,
    realm_icon: tenant.IconUrl ?? "/static/images/logo/zulip-icon-circle.png",
    realm_uri: "https://" + tenant.Subdomain + ".localhost",
    realm_web_public_access_enabled: false,
  };
};
