# Schema Invariants

The schema is designed to make isolation failures hard to write.

## Invariants

- The migration creates only product-owned table names.
- Workspace-owned tables include `workspace_id`.
- Workspace-owned ID tables use composite primary keys with `workspace_id` and `id`.
- Foreign keys to workspace-owned tables include `workspace_id` in source and target columns.
- Global identity/profile tables are intentionally not workspace-owned.
- API compatibility vocabulary does not define core tables.

## Required Tests

The non-compiler test suite parses the migration and package files to assert these invariants. Build-time tests will be re-enabled after the Tsonic package wave lands.
