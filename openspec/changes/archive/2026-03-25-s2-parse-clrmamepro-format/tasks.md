## 1. Types

- [x] 1.1 Add `DatFile`, `DatHeader`, `DatGame`, `DatRom` interfaces to `src/dat/types.ts`
- [x] 1.2 Add `DatParseResult` (`{ ok: true; dat: DatFile }`) and `DatParseError` (`{ ok: false; error: { type: 'parse-error'; message: string; line?: number } }`) to `src/dat/types.ts`
- [x] 1.3 Export new types from `src/dat/index.ts` barrel

## 2. Tokenizer

- [x] 2.1 Create `src/dat/parser.ts` with `tokenize()` internal function
- [x] 2.2 Implement four token types: `identifier`, `literal` (quoted string), `open`, `close`
- [x] 2.3 Handle quoted-string state — parentheses inside quotes (`"Tetris (World)"`) MUST NOT produce `open`/`close` tokens
- [x] 2.4 Handle unquoted values — bare integers (`1048576`) and bare hex strings (`ABCD1234`) tokenized as `identifier`
- [x] 2.5 Track line numbers during tokenization for error reporting
- [x] 2.6 Normalize `\r\n` to `\n` before tokenizing

## 3. Parser

- [x] 3.1 Implement `parseDat(content: string)` as the public API, exported from `src/dat/parser.ts`
- [x] 3.2 Implement stack-based block parser consuming the token stream
- [x] 3.3 Parse `clrmamepro (...)` block into `DatHeader` — extract name, description, version, author, homepage?, url?
- [x] 3.4 Parse `header (...)` block identically to `clrmamepro (...)` (alternate header name)
- [x] 3.5 Parse `game (...)` blocks into `DatGame` — extract name, description?, comment?
- [x] 3.6 Parse nested `rom (...)` blocks into `DatRom` — extract name, size, crc?, md5?, sha1?, serial?
- [x] 3.7 Collect multiple `rom (...)` blocks per game into `game.roms` array
- [x] 3.8 Parse `size` field as `number` (not string)
- [x] 3.9 Normalize checksum fields (crc, md5, sha1) to uppercase after extraction
- [x] 3.10 Ignore unknown fields silently — no error on unrecognized keys
- [x] 3.11 Ignore unknown top-level blocks (anything that isn't `clrmamepro`, `header`, or `game`)
- [x] 3.12 Return `DatParseError` with message and line number for structural errors (unmatched parens, missing required fields)
- [x] 3.13 Add TSDoc with `@intent`, `@guarantee`, `@constraint` to `parseDat()`

## 4. Barrel Export

- [x] 4.1 Export `parseDat` from `src/dat/index.ts`

## 5. Test Fixtures

- [x] 5.1 Create NES DAT fixture string in `test/parser.test.ts` — real header + 3-4 game entries from NES DAT
- [x] 5.2 Create multi-ROM fixture (BIOS/System.dat style — multiple `rom` blocks in one `game`)
- [x] 5.3 Create minimal fixture — game with only name and one ROM (no description, no comment, no optional checksums)
- [x] 5.4 Create serial fixture — ROM entry with `serial` field (disc-based system)
- [x] 5.5 Create malformed fixtures — missing close paren, empty content, header-only

## 6. Tests

- [x] 6.1 Test: successful parse returns `{ ok: true }` with correct header fields
- [x] 6.2 Test: `header (...)` block parsed identically to `clrmamepro (...)`
- [x] 6.3 Test: optional header fields (homepage, url) are undefined when absent
- [x] 6.4 Test: games array contains all game entries with correct names
- [x] 6.5 Test: single ROM per game — all fields extracted (name, size, crc, md5, sha1)
- [x] 6.6 Test: multiple ROMs per game — `game.roms` array has correct length and order
- [x] 6.7 Test: inline ROM on single line parsed correctly
- [x] 6.8 Test: optional game fields (description, comment) present when specified, undefined when absent
- [x] 6.9 Test: ROM with CRC only — md5 and sha1 are undefined
- [x] 6.10 Test: ROM with no checksums — all checksum fields undefined
- [x] 6.11 Test: serial field extracted when present, undefined when absent
- [x] 6.12 Test: checksums normalized to uppercase (mixed-case input → uppercase output)
- [x] 6.13 Test: size parsed as number, not string
- [x] 6.14 Test: `\r\n` line endings produce same result as `\n`
- [x] 6.15 Test: quoted strings with parentheses — `"Tetris (World) (Rev 1)"` parsed as single value
- [x] 6.16 Test: unknown fields ignored silently
- [x] 6.17 Test: header-only DAT (no games) returns `{ ok: true }` with empty games array
- [x] 6.18 Test: malformed content returns `{ ok: false, error: { type: 'parse-error' } }` with message
- [x] 6.19 Test: empty string input returns appropriate error

## 7. Validation

- [x] 7.1 `npm run lint` passes
- [x] 7.2 `npm test` — all tests pass (Node + Bare)
- [x] 7.3 Coverage remains above 80% all thresholds
- [x] 7.4 TSDoc follows `@intent` → `@guarantee` → `@constraint` order
