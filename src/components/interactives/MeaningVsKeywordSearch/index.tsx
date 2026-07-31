import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl, Toggle } from '../../primitives';
import type { SegmentedOption } from '../../primitives';
import {
  METHOD_HEADING,
  METHOD_NAME,
  METHOD_NOTE,
  PASSAGE_TEXT,
  PASSAGE_TITLE,
  QUERY_LABEL,
  QUERY_TEXT,
  TAGS,
  TEXT,
} from './data.en';
import {
  ANSWER,
  answerRank,
  PASSAGE_IDS,
  QUERY_IDS,
  retrievedCount,
  shortlist,
} from './logic';
import type { Hit, Method, PassageId, QueryId } from './logic';

export interface MeaningVsKeywordSearchProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/** The question asked in ordinary words, where meaning-search wins outright. */
const DEFAULT_QUERY: QueryId = 'password';
const DEFAULT_COMBINED = false;

const QUERY_OPTIONS: readonly SegmentedOption<QueryId>[] = QUERY_IDS.map(
  (id) => ({ value: id, label: QUERY_LABEL[id] }),
);

interface ResultListProps {
  method: Method;
  hits: readonly Hit[];
  answer: PassageId;
  /** Shown under the list when this method never retrieved the answer. */
  footnote?: string;
}

/**
 * One method's shortlist. Ranks come from the `<ol>` rather than from counting
 * in here, so the view does no arithmetic of any kind.
 */
function ResultList({ method, hits, answer, footnote }: ResultListProps) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-rule bg-paper px-3 py-3">
      <p className="font-mono text-2xs tracking-wide text-ink-muted uppercase">
        {METHOD_HEADING[method]}
      </p>

      <ol className="flex list-inside list-decimal flex-col gap-2">
        {hits.map((hit) => (
          <li key={hit.id} className="text-sm text-ink">
            {PASSAGE_TITLE[hit.id]}{' '}
            <span className="font-mono text-xs text-ink-faint">
              {TEXT.score(hit.score)}
            </span>
            <span className="mt-0.5 block pl-5 font-mono text-2xs text-ink-faint">
              {hit.matched.length === 0
                ? TEXT.sharedNone
                : TEXT.matched(hit.matched)}
            </span>
            {hit.id === answer ? (
              <span className="mt-0.5 block border-l-2 border-l-accent-2 bg-accent-2-soft py-0.5 pl-2 text-xs text-ink-muted">
                {TAGS.answer}
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      <p className="text-xs text-ink-faint">{METHOD_NOTE[method]}</p>
      {footnote === undefined ? null : (
        <p className="border-l-2 border-l-accent bg-accent-soft py-1 pl-2 text-xs text-ink-muted">
          {footnote}
        </p>
      )}
    </div>
  );
}

/**
 * Teaches one thing: meaning-search and keyword-search fail on opposite
 * questions, so the ordinary answer is to run both.
 *
 * BOTH HALVES, ONE SHELF. A reader shown only the first two questions leaves
 * believing meaning-search replaced keyword-search, which is the belief this
 * unit exists to take away. So the two exact strings sit in the same control,
 * one click away, over the same eight pages — and the swap happens to a method
 * the reader has just watched win.
 *
 * THE COMBINE SWITCH STARTS OFF. Turned on from the start it reads as a
 * feature; turned on after two questions have gone wrong it reads as the
 * repair, which is what it is.
 *
 * No fallback is passed to the panel: a radio group, a switch and two lists of
 * text, none of which need hover or drag precision, and all of which work on a
 * phone once the columns stack. Nothing animates beyond the switch itself, so
 * `prefers-reduced-motion` has nothing to slow down.
 */
export function MeaningVsKeywordSearch({
  title,
  lead,
}: MeaningVsKeywordSearchProps = {}) {
  const [query, setQuery] = useState<QueryId>(DEFAULT_QUERY);
  const [combined, setCombined] = useState(DEFAULT_COMBINED);

  const copy = ui.interactives.MeaningVsKeywordSearch;
  const answer = ANSWER[query];

  const listFor = (method: Method) =>
    shortlist(method, query, PASSAGE_TEXT, QUERY_TEXT);

  const sentenceFor = (method: Method) => {
    const rank = answerRank(method, query, PASSAGE_TEXT, QUERY_TEXT);
    return rank === null
      ? TEXT.absent(METHOD_NAME[method])
      : TEXT.ranked(METHOD_NAME[method], rank);
  };

  const keywordMissed =
    answerRank('keyword', query, PASSAGE_TEXT, QUERY_TEXT) === null;

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setQuery(DEFAULT_QUERY);
        setCombined(DEFAULT_COMBINED);
      }}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-muted">{TEXT.intro}</p>

        <div className="rounded-md border border-rule bg-paper-sunken px-3 py-3">
          <p className="font-mono text-2xs tracking-wide text-ink-muted uppercase">
            {TEXT.shelfHeading}
          </p>
          <ul className="mt-2 grid gap-2 md:grid-cols-2">
            {PASSAGE_IDS.map((id) => (
              <li key={id} className="text-sm text-ink-muted">
                <span className="block font-medium text-ink">
                  {PASSAGE_TITLE[id]}
                </span>
                {PASSAGE_TEXT[id]}
              </li>
            ))}
          </ul>
        </div>

        <SegmentedControl<QueryId>
          label={TEXT.queryLabel}
          options={QUERY_OPTIONS}
          value={query}
          onChange={setQuery}
        />

        <div className="rounded-md border border-rule bg-paper-sunken px-3 py-2">
          <p className="font-mono text-2xs tracking-wide text-ink-muted uppercase">
            {TEXT.askedHeading}
          </p>
          <p className="mt-0.5 text-sm text-ink">{QUERY_TEXT[query]}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <ResultList
            method="meaning"
            hits={listFor('meaning')}
            answer={answer}
          />
          <ResultList
            method="keyword"
            hits={listFor('keyword')}
            answer={answer}
            footnote={`${TEXT.retrieved(
              retrievedCount(query, PASSAGE_TEXT, QUERY_TEXT),
              PASSAGE_IDS.length,
            )}${keywordMissed ? ` ${TEXT.missing}` : ''}`}
          />
        </div>

        <Toggle
          label={TEXT.combineLabel}
          description={TEXT.combineDescription}
          checked={combined}
          onChange={setCombined}
        />

        {combined ? (
          <ResultList method="both" hits={listFor('both')} answer={answer} />
        ) : null}

        {/* The lists change silently for anyone not looking at them, and where
            the right page landed is the whole exercise, so it is said here in
            one region rather than left to the tagged rows. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {sentenceFor('meaning')} {sentenceFor('keyword')}
          {combined ? ` ${sentenceFor('both')}` : ''}
        </p>
      </div>
    </InstrumentPanel>
  );
}
