## Context

S1 (`fetchDat`) returns raw CLRMamePro DAT content as a string. S3 (Hyperbee data layer) and S4 (ROM verification) both need parsed, typed game/ROM data. This parser is the bridge.

CLRMamePro format is a parenthesis-delimited, key-value block language — not XML, not JSON. It was created by the CLRMamePro ROM management tool and is used by Libretro Database for all DAT files. The format has a header block (`clrmamepro (...)` or `header (...)`) followed by game blocks containing nested ROM entries.

File sizes in Libretro Database range from 363 bytes to 5.7 MB (53 of 54 files), with one outlier at 79 MB (J2ME). The NES DAT — our reference system — is 1.4 MB.

No existing npm package works in Bare runtime. robloach-datfile (the closest) depends on Node `stream.Readable` and `readline`.

## Goals / Non-Goals

**Goals:**
- Parse any valid CLRMamePro DAT string into a typed `DatFile` structure
- Handle the full field set: header metadata, game entries, multi-ROM per game, optional checksums, serial numbers
- Return typed errors for malformed input with line number context
- Zero external dependencies — pure string processing
- Full Bare runtime compatibility

**Non-Goals:**
- XML DAT format (MAME uses XML — different parser, different story)
- Streaming/async parsing (files are small enough for synchronous processing)
- DAT file writing/serialization (read-only parser)
- Fuzzy field matching or format auto-detection
- Performance optimization beyond "doesn't block noticeably on 5MB files"

## Decisions

### 1. Two-phase architecture: tokenizer + parser

**Decision:** Separate the lexer (tokenizer) from the parser. The lexer converts raw text into a token stream; the parser consumes tokens and builds the typed structure.

**Alternative considered:** Single-pass regex-per-line approach (robloach's model). Rejected — regex-per-line breaks on inline ROM entries like `rom ( name "file.gb" size 1048576 crc ABCD1234 )` which pack multiple key-value pairs on one line. A proper tokenizer handles this naturally.

**Rationale:** CLRMamePro format has two tricky parsing challenges: (1) parentheses inside quoted strings like `"Tetris (World)"`, and (2) inline blocks where key-value pairs and nesting happen on the same line. A tokenizer that tracks quoted-string state solves both cleanly.

### 2. Token types

**Decision:** Four token types:
- `identifier` — unquoted strings: block names (`game`, `rom`, `clrmamepro`), field names (`name`, `size`, `crc`), and bare values (`1048576`, `ABCD1234`)
- `literal` — quoted strings: `"Tetris (World) (Rev 1)"`
- `open` / `close` — parentheses `(` and `)` (only when not inside quotes)

**Alternative considered:** Also tokenizing comments (`//` line comments, `/* */` block comments). Deferred — comments are valid in the format but rare in Libretro DATs. Can be added later without changing the token types.

### 3. Stack-based block parser

**Decision:** The parser maintains a stack of contexts. When it encounters `identifier open`, it pushes a new context onto the stack. Key-value pairs inside the block are added to the current context. On `close`, the context is popped and finalized into the appropriate type (`DatHeader`, `DatGame`, or `DatRom`).

**Rationale:** Game blocks contain nested ROM blocks. A stack naturally handles one level of nesting (game → rom). The format doesn't go deeper than two levels in practice, but the stack approach handles arbitrary depth for free.

### 4. Synchronous, split-then-iterate

**Decision:** `content.replace(/\r\n/g, '\n')` then tokenize the full string. No async, no streaming, no chunking.

**Alternative considered:** Line-by-line streaming via `response.body`. Rejected — the largest relevant DAT file is 5.7 MB (ScummVM). Synchronous processing of a 5 MB string is sub-millisecond for the tokenizer and a few milliseconds for the full parse. No performance justification for async complexity.

### 5. Checksum normalization in the parser layer

**Decision:** All checksum values (CRC, MD5, SHA1) are normalized to uppercase immediately after extraction in the parser, before being stored in `DatRom`.

**Rationale:** DAT files from different sources use inconsistent casing (CRC values are often uppercase, MD5/SHA1 often lowercase). Normalizing once at parse time means all downstream code can do direct string comparison without case conversion.

### 6. Discriminated union return type

**Decision:** `parseDat()` returns `{ ok: true, dat: DatFile } | { ok: false, error: { type: 'parse-error', message: string, line?: number } }`. Consistent with `fetchDat()` and `fetchSystemIndex()`.

**Alternative considered:** Throwing on parse error. Rejected — the codebase uses Result types consistently. Callers expect to pattern-match on `result.ok`.

### 7. Header block name flexibility

**Decision:** Accept both `clrmamepro (...)` and `header (...)` as valid header block identifiers. Any other top-level block name that isn't `game` is ignored (future-proofing for unknown block types).

**Rationale:** The official format uses `clrmamepro` but some tools emit `header`. Libretro DATs use `clrmamepro`, but being lenient costs nothing and prevents breakage if upstream changes.

## Risks / Trade-offs

**[Inline ROM entries on single line]** → The most common format in Libretro DATs puts all ROM fields on one line: `rom ( name "file.gb" size 1048576 crc ABCD )`. The tokenizer handles this by design — tokens are position-based, not line-based. But this is the most important thing to get right in tests.

**[Missing checksums]** → Some DAT entries have CRC only, some have all three (CRC, MD5, SHA1), some have none. The types already mark all checksum fields as optional. Tests must cover partial checksum scenarios.

**[Unknown fields]** → DAT files may contain fields we don't extract (e.g., `status`, `region`, `language`). Parser should ignore unknown fields silently — not error on them. This is intentional leniency.

**[Empty files or header-only files]** → A DAT with only a header block and no games is valid (newly created systems with no dumps yet). Parser should return `{ ok: true, dat: { header, games: [] } }`.

**[Line number tracking for errors]** → The tokenizer operates on the full string, not line-by-line. Line numbers in error messages require tracking newline positions during tokenization. Worth the complexity — a parse error without a line number is useless for debugging.
