/**
 * The primitive control set.
 *
 * Every interactive composes these rather than rolling its own controls. That
 * is what keeps fifty instruments, built over a long time, feeling like one
 * product — and it means accessibility work happens once, here, instead of
 * being re-attempted (and re-broken) per instrument.
 */

export { InstrumentPanel } from './InstrumentPanel';
export type { InstrumentPanelProps } from './InstrumentPanel';

export { Slider } from './Slider';
export type { SliderProps } from './Slider';

export { Toggle } from './Toggle';
export type { ToggleProps } from './Toggle';

export { SegmentedControl } from './SegmentedControl';
export type {
  SegmentedControlProps,
  SegmentedOption,
} from './SegmentedControl';

export { Stepper } from './Stepper';
export type { StepperProps } from './Stepper';

export { RevealButton } from './RevealButton';
export type { RevealButtonProps } from './RevealButton';

export { Tabs } from './Tabs';
export type { TabItem, TabsProps } from './Tabs';

export { StaticFallback } from './StaticFallback';
export type { StaticFallbackProps } from './StaticFallback';

export { clampToStep } from './stepper-logic';
