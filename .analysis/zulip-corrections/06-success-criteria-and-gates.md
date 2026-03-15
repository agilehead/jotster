# Success Criteria and Validation Gates

This section defines what “done” means.

## 1. Architecture success criteria

The work is successful only if all of the following are true:

- no Zulip-visible resource keeps a string canonical ID
- no permanent `Id` + `PublicId` dual model remains for Zulip-visible resources
- no permanent `resolve*PublicId` bridge helpers remain for Zulip-visible resources
- no handler translates API integer IDs into legacy string IDs for normal operation
- no response/event/initial-state payload leaks legacy string IDs for Zulip-visible resources

## 2. Data-model success criteria

- database PKs for Zulip-visible resources are integer
- database FKs referencing those resources are integer
- entity classes use integer IDs directly
- repo/domain APIs use integer IDs directly

## 3. API success criteria

For all in-scope Zulip operations:

- route exists
- HTTP method matches
- parameter names match
- parameter types match
- response field names match
- response field types match
- error status and code semantics match

The current route inventory report is not enough by itself:

- `.analysis/api-compat/02-summary.md:21`

Final signoff requires contract depth, not only route coverage.

## 4. Test success criteria

Minimum gate:

- full `npm test` green

Required deeper gate:

- every in-scope Zulip operation has direct endpoint-level test coverage
- tests assert type correctness for identifiers and referenced objects
- tests assert event payload IDs
- tests assert initial-state IDs
- tests assert negative/error cases for identifier handling

## 5. Regression gate: no leaked internal IDs

There should be an explicit automated gate that fails if any API or event payload contains internal string IDs where Zulip expects integers.

Suggested checks:

- integration tests for representative payload families
- snapshot/assertion tests for bootstrap state
- event fixture assertions
- route-level response validators for ID fields

## 6. Regression gate: no bridge artifacts in final code

Final completion requires a structural grep/audit pass.

Examples of things that should no longer exist for public-resource ID handling:

- `resolveUserPublicId`
- `resolveChannelPublicId`
- `resolveMessagePublicId`
- `PublicId` fields on canonical Zulip-visible entities
- bridge-only mappers from internal ID to public ID

## 7. Human review success criteria

The code should satisfy this qualitative test:

- if a new engineer opens the repo, the system should look like it was designed around Zulip-style integer IDs from the beginning

If the answer is “they would need to understand a translation layer first,” the work is not finished.
