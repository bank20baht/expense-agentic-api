---
name: generate-backend-module
description: Scaffold a new backend module/resource in apps/server (entity, repository, service, routes) using the project's module generator instead of hand-writing the files from scratch. TRIGGER on requests to create/add a new module, a new API route/endpoint, a new resource, or a new CRUD in the server — phrases like "สร้าง module", "สร้าง api เส้นใหม่", "เพิ่ม module", "add a new module/endpoint/resource", "new CRUD for X". Do NOT trigger for editing an existing module's routes/fields — only for a brand-new module.
---

# Generate backend module

This repo has a code generator for new backend modules
(`apps/server/scripts/generate-module.ts`) that scaffolds files matching the
`modules/todo` reference pattern exactly (entity -> repository -> service ->
routes, cursor pagination, `Result<T>` errors, `requestId`). **Never hand-write
a new module's entity/repository/service/routes files from scratch** — always
generate first, then edit.

If the `backend-agent` subagent is available, delegate the whole task to it —
it already encodes this workflow end to end (generate, adapt fields to the
real domain, wire into `index.ts`, verify with typecheck/lint/curl). Otherwise
follow these steps directly:

1. From `apps/server`, run the generator:

   ```
   bun run generate:module <singular-name>
   ```

   Use a singular lowercase name (e.g. `comment`, `note`, `user`). It refuses
   to run if `src/modules/<name>` already exists.

2. Open the generated `<name>.entity.ts` — it defaults to a single placeholder
   `name: string` field with `// TODO` markers. Replace it with the real
   field(s) the user described, and update `<name>SortFields` to match.

3. Propagate that field change into `<name>.repository.ts` (`create`/`update`
   signatures) and `<name>.routes.ts` (body schemas) — keep the
   id/cursor/pagination/`Result` plumbing untouched, it's already correct.

4. Wire the new module into `src/index.ts`: add the import and `.use(<plural>)`
   inside the existing `.group('/api', (app) => ...)` chain.

5. Verify: `bun run typecheck` and `bun run lint` from the repo root, plus a
   quick curl smoke test (create + list + get-by-id) against a locally
   started server, killing it afterward.

If the generator's output no longer matches what `todo` module actually does
(e.g. after a shared-layer refactor), fix
`apps/server/scripts/generate-module.ts`'s templates first, then generate.
