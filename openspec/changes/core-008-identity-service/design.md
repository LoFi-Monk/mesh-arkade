## Context

CORE-007 shipped `ArkiveService` with a `ProfileServiceStub` — a temporary implementation that always returns null/false. The stub was intentional scaffolding, designed to be replaced by a real identity service in CORE-008. The current codebase has:

- `ProfileService` interface + `ProfileServiceStub` in `src/arkive/`
- `ArkiveService` accepts optional `ProfileService` and gates collection methods behind it
- `saveDatCache()` in `app-root.ts` writes raw DAT XML to `~/mesh-arkade/DATs/` — now dead code per ADR-0018 (Hyperbee-only storage)
- No existing identity, collection, or playlist types beyond the `Profile` interface

The Holepunch identity pattern uses Corestore's named cores: `store.get({ name: 'identity' })` derives a deterministic Hypercore keypair from the Corestore's primary key. This keypair IS the identity — no external auth, no server. The public key is the user's address on the mesh.

## Goals / Non-Goals

**Goals:**
- Replace `ProfileServiceStub` with a real `IdentityService` backed by Corestore keypair + Hyperbee
- Establish the Identity → Child Profile → Collection/Playlist hierarchy as typed interfaces
- Enable identity creation, retrieval, and existence checks
- Enable child profile CRUD (create, list, get active)
- Clean up dead DAT caching code (ADR-0018)
- All rename/retype work: `ProfileService` → `IdentityService` throughout

**Non-Goals:**
- Rep/ratio/trust tracking logic (fields defined as shells, tracking deferred to swarm epics)
- Collection implementation (CORE-009) — only type shells here
- Playlist implementation (CORE-009) — only type shells here
- Multi-identity switching (single identity per Corestore for now — switching is a UX concern for later)
- Swarm identity announcement / discovery (CORE-011)
- Encryption or access control on Hyperbee data (local-only for now)

## Decisions

### 1. Corestore named core for identity keypair

**Decision:** Use `store.get({ name: 'identity' })` to derive the identity Hypercore.

**Rationale:** Corestore derives deterministic keypairs from `primaryKey + name`. The same Corestore always produces the same identity keypair — no seed phrase backup needed for local use. This is the standard Holepunch pattern (used by Keet, Pear).

**Alternatives considered:**
- Random keypair stored in config.json — fragile, not recoverable, breaks if config lost
- External auth (OAuth, passkeys) — contradicts P2P-first architecture
- Hyperswarm secret key directly — Corestore already manages this; no need to go lower

### 2. Hyperbee sub-tree for identity and profile data

**Decision:** Store identity metadata at `identity/` prefix and child profiles at `identity/profiles/<id>/` in the existing Hyperbee instance.

**Rationale:** One Hyperbee per Corestore is the standard pattern. Sub-keys provide logical separation without extra infrastructure. The same `MeshStore.db` used for DAT data also holds identity data.

**Key layout:**
```
identity/displayName     → string
identity/settings        → JSON (system-level settings)
identity/publicKey       → hex string (derived, cached for convenience)
identity/profiles/<id>/displayName  → string
identity/profiles/<id>/avatar       → string
identity/profiles/<id>/settings     → JSON (gaming settings)
identity/profiles/<id>/active       → boolean
```

**Alternatives considered:**
- Separate Hyperbee for identity — unnecessary complexity, more cores to manage
- JSON blob in config.json — not Hypercore-native, can't replicate to swarm later

### 3. Identity IS the default profile

**Decision:** Solo users interact through their Identity directly. Child profiles are optional. The Identity has all profile fields (display name, settings) plus identity-only fields (keypair, rep, ratio, collections).

**Rationale:** Most users will never create child profiles. Forcing profile creation on first run adds friction. The identity seed grows into a tree only when needed.

### 4. Collection lives on Identity, Playlist lives on child Profile

**Decision:** `Collection` = verified game library, tied to rep, owned by Identity. `Playlist` = curated list drawn from Collection, owned by child Profile, no rep implications.

**Rationale:** Collections are the unit of trust on the mesh — what games you have, verified against DATs. Rep accrues at the identity level. Playlists are personal curation with no trust implications — they belong to the profile layer.

### 5. IdentityService injected into ArkiveService (same pattern as ProfileService)

**Decision:** `ArkiveService` constructor accepts `identity?: IdentityService`. Same optional injection pattern. Collection-gated methods check identity instead of profile.

**Rationale:** Preserves the existing architecture. No Hub/DI container needed yet — manual composition is fine for two services.

### 6. Remove saveDatCache() and DATs/ directory (ADR-0018)

**Decision:** Delete `saveDatCache()` from `app-root.ts`, remove its call from `refreshCatalog()`, stop creating `DATs/` in `initAppRoot()`. Hyperbee is the sole DAT store.

**Rationale:** ADR-0018 (Hyperbee-Only DAT Storage). Storing DATs twice (XML + Hyperbee) wastes ~5MB per system with no benefit. Export capabilities (source DAT + ARKive DAT) replace the physical cache.

## Risks / Trade-offs

**[Identity data in shared Hyperbee]** → The same Hyperbee holds DAT catalog data and identity data. If the Hyperbee corrupts, both are lost. **Mitigation:** This is acceptable for local-only Phase 1. Hypercore's append-only log provides inherent corruption resistance. Backup/export is a future concern.

**[No encryption on local Hyperbee]** → Identity settings and profile data are stored unencrypted. **Mitigation:** Local-only storage. Pear.config.storage is app-private. Encryption adds complexity with no threat model benefit until swarm replication.

**[Child profile IDs]** → Using `randomBytes(16).toString('hex')` for profile IDs. Collision probability is negligible for local use. **Mitigation:** If we ever need deterministic IDs (e.g., for swarm sync), we can migrate to content-addressed IDs.

**[saveDatCache removal is breaking]** → Any code calling `saveDatCache()` or expecting `~/mesh-arkade/DATs/` will break. **Mitigation:** Only `refreshCatalog()` calls it internally. No external consumers. Tests for `saveDatCache` are deleted, not updated.
