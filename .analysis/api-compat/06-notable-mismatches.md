# Notable mismatches and exclusions

## Remaining exclusions

- `POST /realm/playgrounds`
- `DELETE /realm/playgrounds/{playground_id}`
- `GET /calls/bigbluebutton/create`
- `POST /calls/nextcloud_talk/create`
- `POST /calls/constructorgroups/create`

## Notes

- The compatibility wave closes the prior in-scope route gaps for persisted data, auth compatibility, user compatibility, channel compatibility, push compatibility, message compatibility, and Zulip outgoing webhook/docs endpoints.
- Wildcard file routes and navigation-view fragment routes are implemented in Jotster using raw-path and wildcard-style Express routes rather than literal Zulip OpenAPI template syntax. This report treats those as compatible by normalized route shape.
- Direct test coverage is still a lower bound. A route can be behaviorally covered without a literal endpoint string match in a test file.
