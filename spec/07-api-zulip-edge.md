# Zulip API Edge

This package is the only place where Zulip wire vocabulary belongs. It is an adapter for compatibility clients and owns no product persistence.

## Translation Boundary

```text
Zulip wire request
  -> adapter validation
  -> Jotster product command/query
  -> adapter response mapping
  -> Zulip wire response
```

## Allowed Vocabulary In This Edge

The adapter may mention wire names such as realm, stream, topic, narrow, and subscription when parsing or emitting compatibility payloads. Those names must not become core table names, entity names, resource paths, or service names.

## Persistence Rule

Compatibility state is derived from product-owned tables whenever possible. If a compatibility-only value is unavoidable, it must live in an adapter-owned compatibility table with explicit ownership and no influence over core authorization.
