import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Tabs } from './Tabs';

const TABS = [
  { id: 'java', label: 'Java', content: <p>java body</p> },
  { id: 'python', label: 'Python', content: <p>python body</p> },
  { id: 'rust', label: 'Rust', content: <p>rust body</p> },
];

describe('Tabs', () => {
  it('names the tab list and selects the first tab by default', () => {
    render(<Tabs label="Language" tabs={TABS} />);

    expect(screen.getByRole('tablist', { name: 'Language' })).toBeVisible();
    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(
      'Java',
    );
    expect(screen.getByText('java body')).toBeVisible();
  });

  it('honours defaultValue when uncontrolled', () => {
    render(<Tabs label="Language" tabs={TABS} defaultValue="python" />);

    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(
      'Python',
    );
  });

  it('shows only the selected panel', () => {
    render(<Tabs label="Language" tabs={TABS} />);

    expect(screen.getByText('java body')).toBeVisible();
    expect(screen.queryByText('python body')).not.toBeInTheDocument();
  });

  it('switches panels on click', async () => {
    const user = userEvent.setup();
    render(<Tabs label="Language" tabs={TABS} />);

    await user.click(screen.getByRole('tab', { name: 'Python' }));

    expect(screen.getByText('python body')).toBeVisible();
    expect(screen.queryByText('java body')).not.toBeInTheDocument();
  });

  it('uses a roving tabindex so Tab reaches the list once', () => {
    render(<Tabs label="Language" tabs={TABS} />);

    expect(screen.getByRole('tab', { name: 'Java' })).toHaveAttribute(
      'tabindex',
      '0',
    );
    expect(screen.getByRole('tab', { name: 'Python' })).toHaveAttribute(
      'tabindex',
      '-1',
    );
  });

  it('moves between tabs with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<Tabs label="Language" tabs={TABS} />);

    screen.getByRole('tab', { name: 'Java' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(
      'Python',
    );
    expect(screen.getByRole('tab', { name: 'Python' })).toHaveFocus();
  });

  it('wraps around at both ends', async () => {
    const user = userEvent.setup();
    render(<Tabs label="Language" tabs={TABS} />);

    screen.getByRole('tab', { name: 'Java' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(
      'Rust',
    );

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(
      'Java',
    );
  });

  it('jumps to the first and last tab with Home and End', async () => {
    const user = userEvent.setup();
    render(<Tabs label="Language" tabs={TABS} />);

    screen.getByRole('tab', { name: 'Java' }).focus();
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(
      'Rust',
    );

    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(
      'Java',
    );
  });

  it('reports changes and defers to the parent when controlled', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Tabs label="Language" tabs={TABS} value="java" onChange={onChange} />,
    );

    await user.click(screen.getByRole('tab', { name: 'Python' }));

    expect(onChange).toHaveBeenCalledWith('python');
    // Controlled: the parent did not change `value`, so the view must not move.
    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(
      'Java',
    );
  });

  it('falls back to the first tab when the controlled value matches nothing', () => {
    render(<Tabs label="Language" tabs={TABS} value="cobol" />);

    // Rendering no selected tab and an empty panel would be worse than this.
    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(
      'Java',
    );
  });

  it('renders nothing when given no tabs', () => {
    const { container } = render(<Tabs label="Language" tabs={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('wires each panel to its tab', () => {
    render(<Tabs label="Language" tabs={TABS} />);

    const tab = screen.getByRole('tab', { name: 'Java' });
    const panel = screen.getByRole('tabpanel');

    expect(tab).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', tab.id);
  });
});
