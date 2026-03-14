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
- The remaining parity question is no longer route presence; it is the depth of request, response, permission, and error-contract assertions for each endpoint.
