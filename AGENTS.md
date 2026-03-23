# Agent Instructions — Mesh ARKade

This file applies to all AI agents working in this repository.

---

## Before You Write Any Code

**Read `resources/document-ref.md` first.**

Pear and the Holepunch ecosystem are niche and fast-moving. Your training data is likely outdated or incomplete. `resources/document-ref.md` maps the official documentation and key repos you need to consult before touching anything related to Pear, Bare, Hyperswarm, Hyperbee, HyperDHT, Hypercore, or any Holepunch module.

Do not guess at Pear/Bare APIs. Look them up.

---

## Comment Style (TSDoc)

All functions, classes, and modules must have TSDoc comments. The required shape is fixed — do not deviate from the order:

```ts
/**
 * @intent   What this does and why it exists.
 * @guarantee What the caller can rely on when this succeeds.
 * @constraint Any preconditions, limits, or side-effects the caller must know about.
 */
```

**Rules:**
- `@intent` → `@guarantee` → `@constraint` — this order is mandatory
- Comments must explain intent and guarantees, never restate the implementation
- Vague or speculative comments are forbidden ("// might work", "// TODO: fix later")
- Do not add comments to code you did not write unless fixing a bug in that code
