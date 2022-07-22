/**
 * Deputy's current version, exported as a string.
 *
 * Why is this in its own file? Multiple modules can be run standalone (without
 * Deputy), but they are still part of Deputy and hence use the same
 * `decorateEditSummary` function. However, Deputy (core) may not be available
 * at the moment, leading to a reference error if `window.deputy.version` were
 * to be used.
 *
 * This ensures that the version is available, even if the core is not loaded.
 * It also keeps standalone versions lightweight to avoid too much additional code.
 *
 * This file is automatically modified by npm when running `npm version ...`. Avoid
 * modifying it manually.
 */
export default /* v */'0.0.3'/* v */;
