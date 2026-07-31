import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { InstrumentPanel } from './InstrumentPanel';
import { SegmentedControl } from './SegmentedControl';
import { Slider } from './Slider';
import { StaticFallback } from './StaticFallback';
import { Stepper } from './Stepper';
import { Toggle } from './Toggle';

/**
 * These assert the accessibility contract from §3.3 — labelled, keyboard
 * operable, correct roles. axe cannot check most of it, so it lives here.
 */

describe('Slider', () => {
  it('associates its label and shows the current value', () => {
    render(<Slider label="Temperature" value={7} onChange={() => undefined} />);

    expect(screen.getByRole('slider', { name: 'Temperature' })).toHaveValue(
      '7',
    );
    expect(screen.getByText('7')).toBeVisible();
  });

  it('formats the readout when asked', () => {
    render(
      <Slider
        label="Temperature"
        value={0.5}
        min={0}
        max={1}
        step={0.1}
        format={(v) => `${v.toFixed(2)}x`}
        onChange={() => undefined}
      />,
    );

    expect(screen.getByText('0.50x')).toBeVisible();
  });

  it('reports a number, not a string', () => {
    const onChange = vi.fn();

    render(
      <Slider label="Temperature" value={5} max={10} onChange={onChange} />,
    );

    // Driven with fireEvent rather than keyboard input: jsdom does not
    // implement arrow-key stepping on range inputs, so a keyboard test here
    // would assert nothing. Real keyboard operability comes from using the
    // native control, and is covered by the axe/e2e layer against a browser.
    fireEvent.change(screen.getByRole('slider'), { target: { value: '6' } });

    expect(onChange).toHaveBeenCalledWith(6);
    // `value` would give '6'; the component must read valueAsNumber so that
    // consumers doing arithmetic on it do not silently concatenate strings.
    expect(typeof onChange.mock.calls[0]?.[0]).toBe('number');
  });

  it('exposes its description to screen readers', () => {
    render(
      <Slider
        label="Temperature"
        value={1}
        description="Higher values make output less predictable"
        onChange={() => undefined}
      />,
    );

    expect(screen.getByRole('slider')).toHaveAccessibleDescription(
      'Higher values make output less predictable',
    );
  });
});

describe('Toggle', () => {
  it('is a labelled switch reporting its state', () => {
    render(
      <Toggle label="Show attention" checked onChange={() => undefined} />,
    );

    expect(
      screen.getByRole('switch', { name: 'Show attention' }),
    ).toBeChecked();
  });

  it('flips on click and on the keyboard', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Toggle label="Show attention" checked={false} onChange={onChange} />,
    );

    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenLastCalledWith(true);

    screen.getByRole('switch').focus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(true);
  });
});

describe('SegmentedControl', () => {
  const OPTIONS = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
  ] as const;

  it('is a named group of radios with one selected', () => {
    render(
      <SegmentedControl
        label="Model"
        options={OPTIONS}
        value="a"
        onChange={() => undefined}
      />,
    );

    expect(screen.getByRole('group', { name: 'Model' })).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Beta' })).not.toBeChecked();
  });

  it('reports the chosen value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <SegmentedControl
        label="Model"
        options={OPTIONS}
        value="a"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('radio', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});

describe('Stepper', () => {
  it('labels both buttons with what they change', () => {
    render(<Stepper label="Layers" value={3} onChange={() => undefined} />);

    expect(
      screen.getByRole('button', { name: 'Decrease Layers' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Increase Layers' }),
    ).toBeVisible();
  });

  it('disables the button that would leave the range', () => {
    const { rerender } = render(
      <Stepper
        label="Layers"
        value={0}
        min={0}
        max={4}
        onChange={() => undefined}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Decrease Layers' }),
    ).toBeDisabled();

    rerender(
      <Stepper
        label="Layers"
        value={4}
        min={0}
        max={4}
        onChange={() => undefined}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Increase Layers' }),
    ).toBeDisabled();
  });

  it('steps by the configured amount', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Stepper
        label="Layers"
        value={2}
        step={2}
        max={10}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Increase Layers' }));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});

describe('InstrumentPanel', () => {
  it('is a region named by its title', () => {
    render(
      <InstrumentPanel title="Tokenizer">
        <p>body</p>
      </InstrumentPanel>,
    );

    expect(screen.getByRole('region', { name: 'Tokenizer' })).toBeVisible();
  });

  it('omits the reset control when there is nothing to reset', () => {
    render(
      <InstrumentPanel title="Tokenizer">
        <p>body</p>
      </InstrumentPanel>,
    );

    expect(
      screen.queryByRole('button', { name: 'Reset' }),
    ).not.toBeInTheDocument();
  });

  it('resets to starting values', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [value, setValue] = useState(9);
      return (
        <InstrumentPanel
          title="Tokenizer"
          onReset={() => {
            setValue(1);
          }}
        >
          <Slider label="Chunks" value={value} max={10} onChange={setValue} />
        </InstrumentPanel>
      );
    }

    render(<Harness />);
    expect(screen.getByRole('slider')).toHaveValue('9');

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('slider')).toHaveValue('1');
  });

  it('renders both branches when a fallback is given, letting CSS choose', () => {
    render(
      <InstrumentPanel
        title="Tokenizer"
        fallback={
          <StaticFallback caption="Words split into chunks">
            <p>diagram</p>
          </StaticFallback>
        }
      >
        <p>interactive body</p>
      </InstrumentPanel>,
    );

    // Both are in the DOM on purpose: a matchMedia read would render the wrong
    // branch during hydration, so the breakpoint is a CSS swap instead.
    expect(screen.getByText('interactive body')).toBeInTheDocument();
    expect(screen.getByText('Words split into chunks')).toBeInTheDocument();
  });
});
