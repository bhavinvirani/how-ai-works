import { useStore } from '@nanostores/react';

import { ui } from '../../copy/en';
import { progressAtom } from '../../lib/progress/LocalStorageProgressStore';

/**
 * The list of linked units in the connections footer, showing which of them the
 * reader has already finished.
 *
 * WHY THIS IS AN ISLAND. The footer was — correctly — a zero-JavaScript
 * component, and progress lives in `localStorage`. So the two never met: a
 * reader landing on a lesson saw "Read this first: three units" with no way to
 * tell which of the three they had already done, short of opening each one and
 * looking. The answer to "do I have the background for this page?" was a manual
 * check every time.
 *
 * It server-renders the links exactly as before, so with JavaScript off the
 * footer is what it always was: every link present, every `why` readable, just
 * without the completion markers. Nothing about the page's usefulness depends
 * on hydration — the markers are an addition, never a gate.
 *
 * The marker is a word, not a tick alone (hard rule 9). A glyph plus a colour
 * would carry the whole meaning in two channels a reader might not have.
 */

export interface ConnectionLinkItem {
  /** The unit's id — the key progress is stored under. */
  id: string;
  href: string;
  title: string;
  why: string;
}

export interface ConnectionLinksProps {
  items: ConnectionLinkItem[];
  /**
   * Show the "you have marked N of these complete" line. On for prerequisites,
   * where it answers a question the reader actually has; off for connections,
   * which are related reading rather than required, and where a running total
   * would read as a chore list.
   */
  summarise?: boolean;
}

export function ConnectionLinks({
  items,
  summarise = false,
}: ConnectionLinksProps) {
  const payload = useStore(progressAtom);

  const isComplete = (id: string) => payload.units[id]?.completedAt != null;
  const done = items.filter((item) => isComplete(item.id)).length;

  return (
    <>
      {summarise && items.length > 0 ? (
        // Announced, because it changes when the reader marks something
        // complete in another tab and the persistent store syncs it across.
        <p aria-live="polite" className="mt-2 text-sm text-ink-faint">
          {ui.unit.prerequisiteSummary(done, items.length)}
        </p>
      ) : null}

      <ul className="mt-2 flex list-none flex-col gap-2 p-0">
        {items.map((item) => (
          <li key={item.id}>
            <a href={item.href} className="font-medium">
              {item.title}
            </a>
            {isComplete(item.id) ? (
              <span className="ml-2 text-sm font-medium whitespace-nowrap text-success">
                <span aria-hidden="true">✓ </span>
                {ui.unit.linkComplete}
              </span>
            ) : null}
            <span className="text-ink-muted"> — {item.why}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
