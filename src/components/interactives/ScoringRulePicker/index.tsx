import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl } from '../../primitives';
import {
  QUALITY_LABELS,
  REPLY_NAMES,
  REPLY_TEXT,
  RULE_LABELS,
  RULE_SENTENCES,
  TEXT,
} from './data.en';
import {
  QUALITIES,
  RULES,
  ruleById,
  scoreboard,
  weakestUnmeasured,
  winner,
} from './logic';
import type { RuleId } from './logic';

export interface ScoringRulePickerProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

const DEFAULT_RULE: RuleId = 'liked';

/**
 * Teaches one thing: the machine keeps whatever scores best, so the score is
 * the specification — and every quality left out of it is free to get worse.
 *
 * The bars under the scoreboard are the point of the instrument. Watching a
 * different answer survive each rule is mildly interesting; watching the
 * surviving answer's unscored qualities sit at 0 and 1 out of 10, with nothing
 * anywhere pushing them up, is the thing the prose is claiming.
 */
export function ScoringRulePicker({
  title,
  lead,
}: ScoringRulePickerProps = {}) {
  const [ruleId, setRuleId] = useState<RuleId>(DEFAULT_RULE);

  const copy = ui.interactives.ScoringRulePicker;
  const rule = ruleById(ruleId);
  const standings = scoreboard(rule);
  const kept = winner(rule);
  const weakness = weakestUnmeasured(kept, rule);

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setRuleId(DEFAULT_RULE);
      }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <SegmentedControl<RuleId>
            label={TEXT.ruleLabel}
            value={ruleId}
            onChange={setRuleId}
            options={RULES.map((option) => ({
              value: option.id,
              label: RULE_LABELS[option.id],
            }))}
          />
          <p className="text-xs text-ink-faint">{RULE_SENTENCES[ruleId]}</p>
        </div>

        <p className="text-sm text-ink-muted">{TEXT.question}</p>

        {/* Declaration order, never re-sorted: only the mark moves, so the
            reader can watch one particular answer win and then lose. */}
        <ul className="flex flex-col gap-1.5">
          {standings.map(({ reply, loss, isKept }) => (
            <li
              key={reply.id}
              className={`flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-md border px-3 py-2 ${
                isKept
                  ? 'border-accent-2/40 bg-accent-2-soft'
                  : 'border-rule bg-paper'
              }`}
            >
              <span
                className={
                  isKept ? 'text-sm text-ink' : 'text-sm text-ink-muted'
                }
              >
                {REPLY_TEXT[reply.id]}
              </span>
              <span className="font-mono text-2xs tracking-wide text-ink-muted uppercase">
                {TEXT.rowTag(loss, isKept)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-ink">
            {TEXT.profileHeading(REPLY_NAMES[kept.id])}
          </p>

          {QUALITIES.map((quality) => {
            const measured = rule.measures.includes(quality);
            const value = kept.qualities[quality];

            return (
              <div key={quality} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-2xs text-ink-muted">
                  {QUALITY_LABELS[quality]}
                </span>

                {/* Decorative: the same number is spelled out beside it. */}
                <div
                  aria-hidden="true"
                  className="h-2 flex-1 rounded-full bg-paper-sunken"
                >
                  <div
                    className={`h-2 rounded-full ${
                      measured ? 'bg-accent-2' : 'bg-rule-strong'
                    }`}
                    style={{ width: `${String(value * 10)}%` }}
                  />
                </div>

                <span className="w-24 shrink-0 font-mono text-2xs text-ink-faint">
                  {TEXT.barTag(value, measured)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Changing the rule silently rewrites the whole panel. This sentence
            is what a screen reader should hear, so it is the live region. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {weakness === null
            ? TEXT.verdictAllMeasured(REPLY_NAMES[kept.id])
            : TEXT.verdict(
                REPLY_NAMES[kept.id],
                QUALITY_LABELS[weakness.quality],
                weakness.value,
              )}
        </p>
      </div>
    </InstrumentPanel>
  );
}
