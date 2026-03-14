# Executive summary

## Totals

- Zulip OpenAPI operations inventoried: **151**
- Jotster route-level compatible operations: **99 / 151** (65.6%)
- Jotster operations with direct test-path coverage: **51 / 151** (33.8%)
- Missing Zulip operations: **52 / 151** (34.4%)

## Breakdown

- `Implemented + directly test-covered`: **51**
- `Implemented route only`: **40**
- `Implemented with parameter-name/path-template differences`: **8**
- `Missing`: **52**

## Current compatibility posture

Jotster has good coverage for the currently exercised core Zulip-style APIs:

- authentication basics
- users
- channels/subscriptions
- messages
- events
- drafts
- invites
- basic org settings and exports

But it is **not** fully Zulip API compatible today. The missing set is still material, especially in these areas:

- navigation views
- reminders
- scheduled messages
- stream/topic read-marker variants
- bot API-key endpoints
- several admin/settings APIs
- some newer channel-folder and user-group variants
- video-call provider endpoints

## Important caution

The **99 / 151** number is a route-level inventory number, not a proof of full behavioral parity.

There are known cases where route presence still overstates compatibility, for example:

- user-group mutation APIs where Zulip expects richer `POST` payload semantics than Jotster currently supports
- channel-folder APIs where Jotster uses a different canonical path shape than Zulip OpenAPI
- user-group update APIs where Zulip expects structured group-setting update objects and Jotster currently accepts simpler scalar values

See `06-notable-mismatches.md` for the important semantic divergences.

## Highest-priority missing endpoints

- `POST /jwt/fetch_api_key`
- `POST /mark_stream_as_read`
- `POST /mark_topic_as_read`
- `GET /navigation_views`
- `GET /reminders`
- `GET /scheduled_messages`
- `PATCH /realm/profile_fields`
- `GET /bots/{bot_id}/api_key`

## Jotster-only / non-Zulip routes

Jotster also exposes routes that are not part of Zulip OpenAPI, for example:

- `GET /api/v1/bots`
- `POST /api/v1/bots`
- `POST /api/v1/external/:integration_name`
- `GET /api/v1/bot_storage`
- `GET /api/v1/realm/icon`
- `POST /internal/admin/tenants`

These are not compatibility wins; they are product-specific or internal extensions.

## Key interpretation

The best current statement is:

- **core Zulip API compatibility is substantial but incomplete**
- **route-level compatibility is about two-thirds of the OpenAPI surface**
- **direct automated test coverage exists for about one-third of the full Zulip OpenAPI surface**
- **full Zulip API parity has not been reached**
