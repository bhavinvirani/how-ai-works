import { useStore } from '@nanostores/react';
import type { ReactNode } from 'react';

import { preferredLanguage } from '../../lib/devaside/languages';
import { Tabs } from '../primitives';

export interface LangTabsProps {
  /** Accessible name for the tab list. */
  label: string;
  /** Only the languages this particular aside actually provides. */
  languages: { id: string; label: string }[];
  /** Astro passes each named slot through as a prop of the same name. */
  [slot: string]: unknown;
}

/**
 * The tab strip inside a developer aside.
 *
 * Driven by a site-wide persistent store, so choosing Python once chooses it
 * everywhere. When an aside does not offer the remembered language, `Tabs`
 * falls back to its first tab rather than rendering an empty panel — which is
 * the normal case, since no aside is obliged to cover every language.
 */
export function LangTabs({ label, languages, ...slots }: LangTabsProps) {
  const selected = useStore(preferredLanguage);

  const tabs = languages.map((language) => ({
    id: language.id,
    label: language.label,
    content: slots[language.id] as ReactNode,
  }));

  return (
    <Tabs
      label={label}
      tabs={tabs}
      value={selected}
      onChange={(id) => {
        preferredLanguage.set(id);
      }}
    />
  );
}
