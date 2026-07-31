import { Handle, Position, ReactFlow } from '@xyflow/react';
import type { NodeProps, NodeTypes } from '@xyflow/react';
import { Fragment, useMemo, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';

import '@xyflow/react/dist/style.css';

import { ui } from '../../../copy/en';
import { HANDLE_SIDES } from '../../../lib/units/map-layout';
import type { HandleSide } from '../../../lib/units/map-layout';
import { InstrumentPanel, StaticFallback } from '../../primitives';
import { buildGraph, sourceHandleId, targetHandleId } from './logic';
import type {
  ChainStep,
  ClusterNode,
  ConceptMapPart,
  ConceptMapUnit,
  UnitNode,
} from './logic';

export interface ConceptMapProps {
  /**
   * Every unit to draw, from the content collection.
   *
   * Optional, with an empty default, so a bare `<ConceptMap />` renders an
   * empty instrument rather than throwing (§3.3). The page supplies the data.
   */
  units?: readonly ConceptMapUnit[];
  /** The Parts, in reading order. Anything not listed here is not drawn. */
  parts?: readonly ConceptMapPart[];
  /**
   * Panel chrome. There is no `ui.interactives.ConceptMap` entry to default
   * from, so the page hands these in — which keeps hard rule 10 intact: no
   * user-facing English is written down in this file.
   */
  title?: string;
  lead?: string;
  /** Teaches what the map shows, to a reader whose screen is too small for it. */
  fallbackCaption?: string;
}

/**
 * The concept map: sixty units, drawn as one chain with a few branches.
 *
 * HOW PART IS ENCODED. Not by colour. `tokens.css` ships two categorical
 * accents, and sixteen more would each need WCAG-checking against three
 * surfaces — and hard rule 9 forbids meaning carried by colour alone anyway. A
 * Part here is a *place*: its units sit inside one dashed box with the Part's
 * name and its number written across the top. Nothing on this map changes
 * meaning in greyscale.
 *
 * HOW IT IS KEYBOARD-SAFE. The canvas is a picture and is treated as one. It is
 * `aria-hidden`, every node and edge is explicitly unfocusable, React Flow's own
 * keyboard handling is switched off, and the node links carry `tabIndex={-1}` —
 * so tabbing through `/map` never enters a sixty-stop canvas it cannot leave.
 * The real navigation is the list of every unit the page renders underneath,
 * which is server-rendered HTML: no hydration, no trap, and it works with
 * JavaScript off.
 *
 * MOTION. There is none. `fitView` runs without a duration, so it is a jump
 * rather than a glide, and the only transitions are token-driven hovers that
 * collapse to zero under `prefers-reduced-motion` (global.css). Nothing here
 * needs to be slowed down because nothing here moves on its own.
 */
export function ConceptMap({
  units = [],
  parts = [],
  title,
  lead,
  fallbackCaption,
}: ConceptMapProps = {}) {
  const graph = useMemo(() => buildGraph(units, parts), [units, parts]);

  // Defaults live in the locale file, like every other instrument. Falling back
  // to '' rendered an empty <h3> for a bare <ConceptMap /> — outside axe's
  // wcag2a tag set, so no gate would have caught it.
  const copy = ui.interactives.ConceptMap;

  /*
   * React Flow measures the DOM to place its edges, so it is mounted only on
   * the client. Until then — and forever, with scripting off — the panel shows
   * the Part chain, which is the same shape at a coarser grain rather than a
   * spinner.
   *
   * `useSyncExternalStore` rather than a flag set in an effect: it returns the
   * server value during hydration too, so the first client render matches the
   * server's exactly and React has nothing to complain about.
   */
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    onTheClient,
    onTheServer,
  );

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      fallback={
        <StaticFallback caption={fallbackCaption ?? copy.lead}>
          <PartChain steps={graph.chain} />
        </StaticFallback>
      }
    >
      <div className="h-[32rem] w-full overflow-auto rounded-md border border-rule bg-paper lg:h-[44rem]">
        {mounted && graph.nodes.length > 0 ? (
          /* aria-hidden sits here rather than on the box, so that the Part
             chain below — which is what a reader gets with scripting off — is
             still announced. */
          <ReactFlow
            aria-hidden="true"
            nodes={graph.nodes}
            edges={graph.edges}
            nodeTypes={NODE_TYPES}
            defaultMarkerColor="var(--color-ink-faint)"
            fitView
            fitViewOptions={FIT_VIEW}
            minZoom={0.12}
            maxZoom={1.8}
            /* A picture, not a widget: nothing in here is focusable, React
               Flow's own key handling is off, and its default aria strings
               never reach a reader. */
            nodesFocusable={false}
            edgesFocusable={false}
            disableKeyboardA11y
            elementsSelectable={false}
            nodesDraggable={false}
            nodesConnectable={false}
            /* The wheel scrolls the page, as it does everywhere else on the
               site. Zooming is pinch or ctrl-wheel; panning is a drag. */
            zoomOnScroll={false}
            panOnScroll={false}
            preventScrolling={false}
            proOptions={PRO_OPTIONS}
          />
        ) : (
          <div className="p-4">
            <PartChain steps={graph.chain} />
          </div>
        )}
      </div>
    </InstrumentPanel>
  );
}

/* The three halves of "has this hydrated yet", as stable module-level values. */
const subscribeToNothing = () => () => undefined;
const onTheClient = () => true;
const onTheServer = () => false;

/**
 * The opening view.
 *
 * `minZoom` here is not the same thing as `minZoom` on the canvas, and the
 * difference is the whole trick: sixty boxes shrunk until they all fit is a
 * grey smudge with no readable label on it. This floor stops the opening fit
 * from going below the point where Part names can still be read, which fits the
 * map's full width and crops a little off the bottom — so the shape arrives
 * legible, and the last stretch is one drag away. Zooming further out is still
 * allowed; that limit is `minZoom` on the canvas itself.
 */
const FIT_VIEW = { padding: 0.05, minZoom: 0.5, maxZoom: 1 };

/**
 * React Flow's own attribution is hidden here and reinstated as a real link in
 * the page, outside the `aria-hidden` canvas — where it can be tabbed to and
 * read out, which it cannot be in here.
 */
const PRO_OPTIONS = { hideAttribution: true };

/**
 * Handles exist only so React Flow knows where an edge should meet a box.
 * Sized to a pixel and made invisible: they are geometry, not controls.
 */
const HANDLE_STYLE: CSSProperties = {
  width: 1,
  height: 1,
  minWidth: 1,
  minHeight: 1,
  border: 'none',
  background: 'transparent',
  opacity: 0,
  pointerEvents: 'none',
};

const HANDLE_POSITION: Record<HandleSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

/** One unit. A link, so a pointer can click straight through to the lesson. */
function UnitNodeView({ data }: NodeProps<UnitNode>) {
  return (
    <>
      {HANDLE_SIDES.map((side) => (
        <Fragment key={side}>
          <Handle
            type="source"
            id={sourceHandleId(side)}
            position={HANDLE_POSITION[side]}
            isConnectable={false}
            style={HANDLE_STYLE}
          />
          <Handle
            type="target"
            id={targetHandleId(side)}
            position={HANDLE_POSITION[side]}
            isConnectable={false}
            style={HANDLE_STYLE}
          />
        </Fragment>
      ))}

      {/* tabIndex={-1} is load-bearing: this link sits inside an aria-hidden
          canvas, and a focusable element inside one is both an axe violation
          and a genuinely confusing place to land. The same link, tabbable and
          announced, is in the page's list of units. */}
      <a
        href={data.href}
        tabIndex={-1}
        className="flex h-full w-full items-start gap-1.5 rounded-md border border-rule-strong bg-paper-raised px-2 py-1.5 no-underline shadow-sheet transition-colors duration-[var(--duration-fast)] ease-out-soft hover:bg-accent-soft"
      >
        <span className="font-mono text-2xs text-ink-faint tabular-nums">
          {data.step}
        </span>
        <span className="line-clamp-3 min-w-0 text-2xs leading-snug font-medium text-ink">
          {data.title}
        </span>
      </a>
    </>
  );
}

/**
 * One Part: the box its units sit in, named.
 *
 * This is the whole Part encoding. The name is written on it, the number says
 * where the Part comes in the reading order, and the units inside are the ones
 * that belong to it — position and label, never hue.
 */
function ClusterNodeView({ data }: NodeProps<ClusterNode>) {
  return (
    <div className="h-full w-full rounded-lg border border-dashed border-rule-strong bg-paper-sunken/70 px-3 pt-2">
      <p className="font-display text-xl leading-tight font-semibold text-ink">
        <span className="font-mono text-sm text-ink-faint tabular-nums">
          {data.index}
        </span>{' '}
        {data.label}
      </p>
    </div>
  );
}

const NODE_TYPES: NodeTypes = {
  cluster: ClusterNodeView,
  unit: UnitNodeView,
};

interface PartChainProps {
  steps: readonly ChainStep[];
}

/**
 * The map at a coarser grain: the Parts, in order, down one line.
 *
 * Shown on a phone in place of the canvas, and before the canvas mounts. It
 * carries the one claim the map is making — that this is a sequence, not a
 * pile — at a size a small screen can actually read. The row of marks beside
 * each Part is how many units are in it, and is decorative: the count is in
 * the page's list underneath, in words.
 */
function PartChain({ steps }: PartChainProps) {
  if (steps.length === 0) return null;

  return (
    <ol className="flex flex-col gap-2 border-l-2 border-rule-strong pl-4">
      {steps.map((step) => (
        <li key={step.id} className="flex flex-col gap-0.5">
          <span className="text-sm leading-snug font-medium text-ink">
            <span
              aria-hidden="true"
              className="font-mono text-2xs text-ink-faint tabular-nums"
            >
              {step.index}
            </span>{' '}
            {step.label}
          </span>
          <span aria-hidden="true" className="flex gap-1">
            {Array.from({ length: step.unitCount }, (_, index) => (
              <span
                key={index}
                className="h-1.5 w-1.5 rounded-xs bg-rule-strong"
              />
            ))}
          </span>
        </li>
      ))}
    </ol>
  );
}
