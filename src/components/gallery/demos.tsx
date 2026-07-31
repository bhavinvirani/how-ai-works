import { useState } from 'react';

import {
  InstrumentPanel,
  SegmentedControl,
  Slider,
  StaticFallback,
  Stepper,
  Tabs,
  Toggle,
  RevealButton,
} from '../primitives';
import type { SegmentedOption, TabItem } from '../primitives';

/**
 * Live demonstrations of each primitive for `/gallery`.
 *
 * Every string a reader sees arrives as a prop from the MDX page, so no
 * user-facing English lives in this file (CLAUDE.md hard rule 10). These
 * wrappers exist only to hold the state a control needs to be operable — they
 * are the smallest thing that makes a primitive real rather than a screenshot.
 */

export function SliderDemo({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  const [value, setValue] = useState(0.7);

  return (
    <Slider
      label={label}
      description={description}
      value={value}
      onChange={setValue}
      min={0}
      max={2}
      step={0.1}
      format={(v) => v.toFixed(1)}
    />
  );
}

export function ToggleDemo({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  const [checked, setChecked] = useState(false);
  return (
    <Toggle
      label={label}
      description={description}
      checked={checked}
      onChange={setChecked}
    />
  );
}

export function SegmentedControlDemo({
  label,
  options,
}: {
  label: string;
  options: SegmentedOption<string>[];
}) {
  const [value, setValue] = useState(options[0]?.value ?? '');
  return (
    <SegmentedControl
      label={label}
      options={options}
      value={value}
      onChange={setValue}
    />
  );
}

export function StepperDemo({ label }: { label: string }) {
  const [value, setValue] = useState(3);
  return (
    <Stepper label={label} value={value} onChange={setValue} min={1} max={8} />
  );
}

export function RevealButtonDemo({
  showLabel,
  hideLabel,
  body,
}: {
  showLabel?: string;
  hideLabel?: string;
  body: string;
}) {
  return (
    <RevealButton showLabel={showLabel} hideLabel={hideLabel}>
      <p>{body}</p>
    </RevealButton>
  );
}

export function TabsDemo({
  label,
  tabs,
}: {
  label: string;
  tabs: { id: string; label: string; body: string }[];
}) {
  const items: TabItem[] = tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    content: <p className="font-mono text-sm">{tab.body}</p>,
  }));

  return <Tabs label={label} tabs={items} />;
}

/** The full instrument shell, with every control inside it. */
export function InstrumentPanelDemo({
  title,
  lead,
  sliderLabel,
  toggleLabel,
  stepperLabel,
}: {
  title: string;
  lead: string;
  sliderLabel: string;
  toggleLabel: string;
  stepperLabel: string;
}) {
  const START = { amount: 0.7, on: false, count: 3 };
  const [state, setState] = useState(START);

  return (
    <InstrumentPanel
      title={title}
      lead={lead}
      onReset={() => {
        setState(START);
      }}
    >
      <div className="flex flex-col gap-4">
        <Slider
          label={sliderLabel}
          value={state.amount}
          min={0}
          max={1}
          step={0.05}
          format={(v) => `${String(Math.round(v * 100))}%`}
          onChange={(amount) => {
            setState((prev) => ({ ...prev, amount }));
          }}
        />
        <Toggle
          label={toggleLabel}
          checked={state.on}
          onChange={(on) => {
            setState((prev) => ({ ...prev, on }));
          }}
        />
        <Stepper
          label={stepperLabel}
          value={state.count}
          min={1}
          max={8}
          onChange={(count) => {
            setState((prev) => ({ ...prev, count }));
          }}
        />
      </div>
    </InstrumentPanel>
  );
}

/** Shows how an instrument degrades below the `md` breakpoint. */
export function StaticFallbackDemo({
  title,
  lead,
  caption,
  interactiveLabel,
}: {
  title: string;
  lead: string;
  caption: string;
  interactiveLabel: string;
}) {
  const [value, setValue] = useState(4);

  return (
    <InstrumentPanel
      title={title}
      lead={lead}
      fallback={
        <StaticFallback caption={caption}>
          <div className="flex h-24 items-center justify-center rounded-md border border-rule bg-paper-sunken">
            <span className="font-mono text-xs text-ink-faint">4</span>
          </div>
        </StaticFallback>
      }
    >
      <Stepper
        label={interactiveLabel}
        value={value}
        min={1}
        max={8}
        onChange={setValue}
      />
    </InstrumentPanel>
  );
}
