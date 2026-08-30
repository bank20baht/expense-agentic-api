/**
 * Semantic symbol rename via ts-morph (LSP-grade, not text replace).
 *
 * Renames a top-level declaration (class / interface / enum / function /
 * type alias) and every reference to it across the project — imports, DI,
 * type positions — without the breakage that sed/grep cause.
 *
 * Usage:
 *   bun run rename:symbol <OldName> <NewName>
 *   # or directly: bun run scripts/rename-symbol.ts <OldName> <NewName>
 *
 * Caveats (handle manually — ts-morph only sees TypeScript):
 *   - Angular component/directive *selectors* and `.html` template usages
 *   - Component file names (.ts/.html/.css/.spec.ts) — rename files via `ng` or by hand
 *   - String-based DI tokens (`InjectionToken` names, string providers)
 */
import { Project } from 'ts-morph'

const [, , oldName, newName] = process.argv
if (!oldName || !newName) {
  console.error('Usage: bun run rename:symbol <OldName> <NewName>')
  process.exit(1)
}

// The root tsconfig.json uses `files: []` + project references, so it adds no
// source files by itself. Load the whole src tree (including *.spec.ts) so the
// rename follows references across both app and test files.
const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
})
project.addSourceFilesAtPaths('src/**/*.ts')

let renamed = 0
for (const sf of project.getSourceFiles()) {
  for (const decl of [
    ...sf.getClasses(),
    ...sf.getInterfaces(),
    ...sf.getEnums(),
    ...sf.getFunctions(),
    ...sf.getTypeAliases(),
  ]) {
    if (decl.getName() === oldName) {
      decl.rename(newName) // semantic rename — updates every reference in loaded files
      renamed++
    }
  }
}

if (renamed === 0) {
  console.error(`No declaration named "${oldName}" found under src/. Nothing renamed.`)
  process.exit(1)
}

project.saveSync()
console.log(`Renamed ${renamed} declaration(s): ${oldName} -> ${newName}`)
console.log(
  'Reminder: check Angular selectors, .html templates, file names, and string DI tokens manually.',
)
