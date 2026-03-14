# Notable mismatches and exclusions

## Remaining exclusions

- `POST /realm/playgrounds`
- `DELETE /realm/playgrounds/{playground_id}`
- `GET /calls/bigbluebutton/create`
- `POST /calls/nextcloud_talk/create`
- `POST /calls/constructorgroups/create`

## Notes

- Every currently in-scope Zulip OpenAPI operation now has both a matching Jotster route and at least one direct endpoint-level test reference.
- Wildcard file routes and navigation-view fragment routes are treated as compatible by normalized route shape, with direct test coverage provided through OpenAPI-style test titles.
- The remaining parity question is no longer route presence; it is the depth of request, response, permission, error-contract, and type-shape assertions for each endpoint.
- Recent semantic hardening has closed the known gaps in:
  - queue event flattening for payloads without `op`
  - drafts payload shape (`to` arrays and `count`)
  - channel-folder update/reorder event payloads
  - user-group update event nesting
  - custom-profile-field required/editable metadata
  - `realm_linkifiers` client-capability gating for `/register` state and queue events
  - stream `typing` event gating for clients without `stream_typing_notifications`
