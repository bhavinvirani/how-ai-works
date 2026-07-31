/**
 * Pure helpers for the page `<head>`.
 *
 * They live apart from `SeoHead.astro` for the same reason interactive logic
 * lives apart from its view: the interesting decisions here — when to append
 * the site name, which pathname form is canonical, when a page is allowed into
 * an index — are string rules with edge cases, and a rule you cannot unit-test
 * is a rule you find out about from Search Console six weeks later.
 */

/**
 * Build the contents of `<title>`.
 *
 * Every page is suffixed with the site name except the home page, which IS the
 * site name — "How AI Actually Works — How AI Actually Works" is the classic
 * way this goes wrong.
 *
 * An em dash rather than a pipe: it is what the prose uses, and the separator
 * is visible in every search result and every browser tab.
 */
export function pageTitle(title: string, siteName: string): string {
  const trimmed = title.trim();
  if (trimmed.length === 0) return siteName;
  if (trimmed === siteName) return siteName;

  // A page that already carries the suffix (an older page, or one written by
  // hand) must not get a second one.
  if (trimmed.endsWith(`— ${siteName}`) || trimmed.endsWith(`- ${siteName}`)) {
    return trimmed;
  }

  return `${trimmed} — ${siteName}`;
}

/**
 * Normalise a pathname to the form the built site actually serves.
 *
 * Astro's default `build.format: 'directory'` emits `units/attention/index.html`,
 * so the served URL carries a trailing slash. `Astro.url.pathname` does not
 * always agree — it reflects the request, and `astro preview` answers both
 * `/units/attention` and `/units/attention/` with the same page.
 *
 * That disagreement is the bug this function exists to prevent: the sitemap is
 * generated from the built file tree and always says `…/attention/`, while a
 * canonical built from the raw pathname could say `…/attention`. Two URLs, one
 * page, and a crawler with no way to know they are the same.
 *
 * Paths whose last segment has an extension (`/404.html`, `/og.png`) are files,
 * not directories, and are left exactly as they are.
 */
export function canonicalPathname(pathname: string): string {
  if (pathname.length === 0) return '/';

  const [path = '', ...rest] = pathname.split(/(?=[?#])/);
  const suffix = rest.join('');

  if (path.endsWith('/')) return `${path}${suffix}`;

  const lastSegment = path.slice(path.lastIndexOf('/') + 1);
  if (lastSegment.includes('.')) return `${path}${suffix}`;

  return `${path}/${suffix}`;
}

/**
 * The value for `<meta name="robots">`.
 *
 * `isPreview` wins over everything. PR previews are published to the same
 * origin as the live site — `bhavinvirani.github.io/how-ai-works/pr-preview/<n>/`
 * — so without this every open pull request is a complete, crawlable copy of
 * the site competing with the real one. `astro.config.mjs` already skips the
 * sitemap on previews for this reason; the sitemap was only ever half of it,
 * because a crawler that finds a page by following a link never consults one.
 *
 * `max-image-preview:large` is what allows a full-size thumbnail in results
 * rather than a postage stamp; the other two lift the default snippet caps.
 */
export function robotsDirective(options: {
  noindex?: boolean;
  isPreview?: boolean;
}): string {
  if (options.isPreview) return 'noindex, nofollow';
  if (options.noindex) return 'noindex, follow';
  return 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
}

/**
 * True when a canonical pathname is the site's home page.
 *
 * Used to decide where the one-per-site `WebSite` JSON-LD node goes. Compares
 * normalised forms so a base path with or without a trailing slash behaves the
 * same — `/how-ai-works` and `/how-ai-works/` are the same page.
 */
export function isHomePath(pathname: string, base: string): boolean {
  return canonicalPathname(pathname) === canonicalPathname(base || '/');
}
