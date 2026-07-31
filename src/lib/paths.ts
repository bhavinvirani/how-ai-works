/**
 * Base-path-safe URL helpers.
 *
 * The site deploys under a subpath (`/how-ai-works/` on GitHub Pages), so every
 * internal link and asset reference has to be prefixed with that base. Getting
 * this wrong is invisible in `astro dev` (which serves from the base too, but
 * forgives root-absolute paths in ways the built output does not) and only
 * surfaces as 404s in production — hence a tested helper rather than string
 * concatenation at each call site.
 *
 * `joinBase` is pure and takes the base explicitly so it can be unit-tested
 * without a Vite environment; `withBase` is the thin runtime wrapper that reads
 * Astro's `import.meta.env.BASE_URL`.
 */

/** Matches anything that must NOT be prefixed: absolute URLs, protocol-relative URLs, fragments, and bare query strings. */
const NON_INTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\?)/i;

/**
 * Join a base path and an internal path into a single, slash-correct URL.
 *
 * Values that are not internal paths (`https://…`, `//cdn…`, `#section`,
 * `mailto:…`, `?q=1`) are returned untouched.
 */
export function joinBase(base: string, path: string): string {
  if (NON_INTERNAL.test(path)) return path;

  // Astro normalises BASE_URL to a trailing slash; strip it so we control joining.
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const leadingSlashPath = path.startsWith('/') ? path : `/${path}`;

  return `${trimmedBase}${leadingSlashPath}`;
}

/** Prefix an internal path with the deployment base path. */
export function withBase(path: string): string {
  return joinBase(import.meta.env.BASE_URL, path);
}

/** True when a link points somewhere outside this site and should not be base-prefixed. */
export function isExternal(path: string): boolean {
  return NON_INTERNAL.test(path);
}
