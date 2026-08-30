---
name: rename-symbol
description: Rename a top-level TypeScript declaration (class, interface, enum, function, or type alias) in apps/server using the project's semantic-rename script instead of sed/grep-replace. TRIGGER on requests to rename a symbol/type/class/interface/function/service/schema in the server codebase — phrases like "เปลี่ยนชื่อ", "rename this type/class/function", "แก้ชื่อ symbol". Do NOT trigger for renaming a variable inside a single function's local scope, a file, or a plain string value — only for a top-level declaration referenced across files.
---

# Rename symbol (server)

`apps/server` has `scripts/rename-symbol.ts`, a semantic rename via
ts-morph (LSP-grade — it understands the TypeScript AST, not text). It
renames a top-level `class` / `interface` / `enum` / `function` / `type`
alias and every reference to it across `src/**/*.ts` (imports, type
positions, everywhere) in one atomic operation.

**Never rename a top-level declaration with `sed`, sweeping `grep`+`Edit`, or
find-and-replace across files.** Text substitution can rename an unrelated
string that happens to match, or miss a reference in a file it didn't touch
(a type-only import, a re-export). Always use this script instead.

## Usage

From `apps/server`:

```
bun run rename:symbol <OldName> <NewName>
```

- Both names are exact, case-sensitive identifiers (e.g. `TodoSortField`,
  not `todo sort field`).
- Fails with "No declaration named ... found" if nothing matches — check the
  spelling/casing before assuming the symbol doesn't exist.
- After renaming, run `bun run typecheck` and `bun run lint` from the repo
  root to confirm nothing broke — the script only rewrites `.ts` source, it
  doesn't validate the result.

## What it does NOT catch (handle manually)

- Angular-style component selectors or `.html` template usages — not
  applicable in this repo (Elysia backend, React frontend), ignore this part
  of the script's own doc comment.
- File names — renaming `TodoSchema` doesn't rename `todo.entity.ts`; rename
  the file yourself (`git mv`) if the module itself is being renamed.
- String-based tokens (e.g. a literal `'TODO_NOT_FOUND'` error code, or any
  plain string that happens to equal the old name) — the script only touches
  TypeScript declarations, not string literals.
- Anything outside `apps/server/src/**/*.ts` — it doesn't cross into
  `apps/web`. If a renamed symbol is also referenced from the frontend
  (unlikely for server-internal types, but check `Static<typeof ...>` usage
  or anything re-exported through the `App` type Eden consumes), verify the
  frontend still typechecks afterward.
