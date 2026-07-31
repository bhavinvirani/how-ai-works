import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl, Toggle } from '../../primitives';
import {
  INBOXES,
  OUTCOME_LABELS,
  RULE_LABELS,
  TEXT,
  WEEK_LABELS,
} from './data.en';
import { bestAchievable, judge, RULES, score, totalMistakes } from './logic';
import type { Outcome, RuleId, Week } from './logic';

export interface SpamRuleWriterProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

const DEFAULT_WEEK: Week = 'this-week';
const DEFAULT_RULES: RuleId[] = [];

/**
 * Teaches one thing: no set of hand-written rules catches all the junk without
 * throwing real mail away — and the set that looks perfect this week stops
 * working the moment senders reword.
 *
 * The second inbox is the instrument's whole reason for existing. A reader who
 * only ever sees week one finds the winning rule and concludes rules work fine;
 * switching weeks is what turns the unit's claim from something asserted into
 * something they just watched happen to their own answer.
 */
export function SpamRuleWriter({ title, lead }: SpamRuleWriterProps = {}) {
  const [week, setWeek] = useState<Week>(DEFAULT_WEEK);
  const [activeRuleIds, setActiveRuleIds] = useState<RuleId[]>(DEFAULT_RULES);

  const copy = ui.interactives.SpamRuleWriter;
  const messages = INBOXES[week];
  const verdicts = judge(messages, activeRuleIds);
  const current = score(messages, activeRuleIds);
  const best = bestAchievable(messages);
  const mistakes = totalMistakes(current);

  const toggleRule = (id: RuleId, on: boolean) => {
    setActiveRuleIds((previous) =>
      on ? [...previous, id] : previous.filter((existing) => existing !== id),
    );
  };

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setWeek(DEFAULT_WEEK);
        setActiveRuleIds(DEFAULT_RULES);
      }}
    >
      <div className="flex flex-col gap-5">
        <SegmentedControl<Week>
          label={TEXT.inboxLabel}
          value={week}
          onChange={setWeek}
          options={[
            { value: 'this-week', label: WEEK_LABELS['this-week'] },
            { value: 'next-week', label: WEEK_LABELS['next-week'] },
          ]}
        />

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-ink">
            {TEXT.rulesLabel}
          </legend>
          {RULES.map((rule) => (
            <Toggle
              key={rule.id}
              label={RULE_LABELS[rule.id]}
              checked={activeRuleIds.includes(rule.id)}
              onChange={(on) => {
                toggleRule(rule.id, on);
              }}
            />
          ))}
        </fieldset>

        <ul className="flex flex-col gap-1.5">
          {verdicts.map(({ message, outcome }) => (
            <li
              key={message.id}
              className={`flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-md border px-3 py-2 ${SURFACE[outcome]}`}
            >
              <span
                className={
                  // Struck through only in combination with the words beside
                  // it — the line is a second cue, never the only one.
                  outcome === 'real-lost' || outcome === 'junk-blocked'
                    ? 'text-sm text-ink-faint line-through'
                    : 'text-sm text-ink'
                }
              >
                {message.subject}
              </span>
              <span className="font-mono text-2xs tracking-wide text-ink-muted uppercase">
                {OUTCOME_LABELS[outcome]}
              </span>
            </li>
          ))}
        </ul>

        {/*
          Toggling one rule silently rewrites eight list rows, which a screen
          reader would otherwise never announce. The running score is the thing
          worth hearing, so it is the live region — not the list.
        */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {mistakes === 0
            ? TEXT.perfect
            : TEXT.damage(current.lost, current.slipped)}{' '}
          {totalMistakes(best.score) === 0
            ? TEXT.bestPossiblePerfect
            : TEXT.bestPossible(totalMistakes(best.score))}
        </p>
      </div>
    </InstrumentPanel>
  );
}

/**
 * Tone per outcome. Every one of these is paired with the outcome spelled out
 * in words on the same row, so nothing here is the sole carrier of meaning
 * (hard rule 9).
 */
const SURFACE: Record<Outcome, string> = {
  'junk-blocked': 'border-success/40 bg-success-soft',
  'junk-slipped': 'border-warning/40 bg-warning-soft',
  'real-kept': 'border-rule bg-paper',
  'real-lost': 'border-danger/40 bg-danger-soft',
};
