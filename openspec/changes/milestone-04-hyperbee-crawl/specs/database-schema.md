# Spec: Hyperbee Database Schema

## Requirement: KV Namespacing
**WHEN** the database is initialized
**THEN** it must use Hyperbee namespaces for logical isolation of data types.

### Implementation Details
- Use `bee.sub('systems')` for system definitions.
- Use `bee.sub('wishlist')` for game metadata.

## Requirement: System Storage
**WHEN** a system is discovered or seeded
**THEN** it must be serialized as JSON and stored under the `systems` namespace.

### Data Structure
Key: `<system-id>` (e.g. `nes`)
Value:
```json
{
  "id": "nes",
  "name": "Nintendo Entertainment System",
  "datUrl": "https://...",
  "lastUpdated": "ISO8601-TIMESTAMP"
}
```

## Requirement: Wishlist Storage
**WHEN** game metadata is parsed from a DAT
**THEN** each entry must be stored under the `wishlist` namespace.

### Data Structure
Key: `game:<sha1>:<system-id>`
Value:
```json
{
  "title": "Super Mario Bros.",
  "sha1": "...",
  "crc": "...",
  "md5": "...",
  "region": "USA",
  "system_id": "nes"
}
```
**Rationale**: Using `sha1` as the primary key suffix allows for high-performance lookup during P2P discovery.
