import { useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

export interface TabItem {
  /** Stable identifier, e.g. a language name. */
  id: string;
  /** What this tab shows, in the learner's words. */
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  /** Accessible name for the tab list — what the tabs are choosing between. */
  label: string;
  tabs: readonly TabItem[];
  /** Controlled selection. Omit for uncontrolled. */
  value?: string;
  onChange?: (id: string) => void;
  /** Initial selection when uncontrolled. Defaults to the first tab. */
  defaultValue?: string;
}

/**
 * The ARIA tabs pattern, with arrow-key navigation.
 *
 * Works controlled or uncontrolled: `DevAside` drives it from a nanostore so
 * that picking Python once picks it everywhere, while a one-off tab group can
 * just manage itself.
 */
export function Tabs({
  label,
  tabs,
  value,
  onChange,
  defaultValue,
}: TabsProps) {
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [internal, setInternal] = useState(
    () => defaultValue ?? tabs[0]?.id ?? '',
  );

  // A controlled `value` that does not match any tab would leave nothing
  // selected, so fall back to the first tab rather than rendering an empty panel.
  const requested = value ?? internal;
  const selected = tabs.some((tab) => tab.id === requested)
    ? requested
    : (tabs[0]?.id ?? '');

  const select = (id: string) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const current = tabs.findIndex((tab) => tab.id === selected);
    if (current === -1) return;

    const lastIndex = tabs.length - 1;
    let next: number | null = null;

    if (event.key === 'ArrowRight')
      next = current === lastIndex ? 0 : current + 1;
    else if (event.key === 'ArrowLeft')
      next = current === 0 ? lastIndex : current - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = lastIndex;

    if (next === null) return;

    event.preventDefault();
    const target = tabs[next];
    if (!target) return;

    select(target.id);
    tabRefs.current[next]?.focus();
  };

  if (tabs.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        aria-label={label}
        className="flex gap-1 border-b border-rule"
      >
        {tabs.map((tab, index) => {
          const isSelected = tab.id === selected;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              // Roving tabindex: Tab reaches the tab list once, then arrow
              // keys move within it.
              tabIndex={isSelected ? 0 : -1}
              onClick={() => {
                select(tab.id);
              }}
              onKeyDown={onKeyDown}
              className={`-mb-px rounded-t-sm border-b-2 px-3 py-1.5 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-out-soft ${
                isSelected
                  ? 'border-accent text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== selected}
          tabIndex={0}
        >
          {tab.id === selected ? tab.content : null}
        </div>
      ))}
    </div>
  );
}
