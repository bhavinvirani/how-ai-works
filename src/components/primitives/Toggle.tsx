import { useId } from 'react';

import { CONTROL_LABEL, CONTROL_TRANSITION } from './styles';

export interface ToggleProps {
  /** What turning this on does, in the learner's words. */
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Extra context announced to screen readers. */
  description?: string;
  disabled?: boolean;
}

/**
 * An on/off switch.
 *
 * `role="switch"` rather than a checkbox: a checkbox says "include this in a
 * submission", a switch says "this is on right now", and the latter is what an
 * instrument control means. Labelled via aria-labelledby because a `<label>`
 * element only associates with form controls, not buttons.
 */
export function Toggle({
  label,
  checked,
  onChange,
  description,
  disabled = false,
}: ToggleProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span id={labelId} className={CONTROL_LABEL}>
          {label}
        </span>

        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={labelId}
          aria-describedby={description ? descriptionId : undefined}
          disabled={disabled}
          onClick={() => {
            onChange(!checked);
          }}
          className={`${CONTROL_TRANSITION} relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-rule-strong disabled:cursor-not-allowed disabled:opacity-50 ${
            checked ? 'bg-accent-2' : 'bg-paper-sunken'
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-4 w-4 rounded-full border border-rule-strong bg-paper-raised transition-transform duration-[var(--duration-fast)] ease-out-soft ${
              checked ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {description ? (
        <p id={descriptionId} className="text-xs text-ink-faint">
          {description}
        </p>
      ) : null}
    </div>
  );
}
