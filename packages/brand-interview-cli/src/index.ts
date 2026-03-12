/**
 * @daf/brand-interview-cli
 * Pre-pipeline Brand Interview CLI entry point
 */

export { BrandProfile, Archetype, Scope } from './schema'
export { writeProfile, ensureOutputDir } from './writer'

interface Exports {
  BrandProfile: typeof import('./schema').BrandProfile
  Archetype: typeof import('./schema').Archetype
  Scope: typeof import('./schema').Scope
  writeProfile: typeof import('./writer').writeProfile
  ensureOutputDir: typeof import('./writer').ensureOutputDir
}

export default {} as Exports
