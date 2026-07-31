import { useId, useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl } from '../../primitives';
import { PRESET_IDS, PRESETS, SPACE_MARK, TEXT } from './data.en';
import type { PresetId } from './data.en';
import { MAX_LENGTH, MERGES, readable, split } from './logic';

export interface TokenSplitterProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/** Ordinary English first, so the reader has a baseline to be surprised from. */
const DEFAULT_TEXT = PRESETS.english.text;

/**
 * Teaches one thing: a model reads neither letters nor words, but chunks from a
 * list that was fixed before it was trained — so what a piece of text costs is
 * not how long it looks, it is how well that list happens to fit it.
 *
 * The typing is the point. A reader who only clicks the four presets learns
 * that the counts differ; a reader who types their own surname into it watches
 * their own name come apart, which is the version that stays. Everything the
 * panel says about a piece of text is arithmetic done in `logic.ts` on the
 * text in the box, so there is nothing here that could be true of the examples
 * and false of whatever the reader tries next.
 *
 * Nothing animates, so `prefers-reduced-motion` has nothing to slow down: every
 * keystroke redraws instantly.
 */
export function TokenSplitter({ title, lead }: TokenSplitterProps = {}) {
  const [text, setText] = useState(DEFAULT_TEXT);
  const inputId = useId();
  const descriptionId = `${inputId}-description`;

  const copy = ui.interactives.TokenSplitter;
  const stats = split(text);
  const labels = stats.pieces.map(readable);

  // Nothing is checked when the reader has typed something of their own, which
  // is exactly what a radio group should do when none of its options is the
  // current value.
  const selected: PresetId | '' =
    PRESET_IDS.find((id) => PRESETS[id].text === text) ?? '';

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setText(DEFAULT_TEXT);
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Every piece is a box of its own, so the cuts are carried by the
            gaps rather than by any colour (hard rule 9); a piece that is a raw
            byte is dashed as well as unreadable. The readout below names all of
            it in words, which is the only version a screen reader gets. */}
        <div
          aria-hidden="true"
          className="flex min-h-14 flex-wrap content-start gap-1 rounded-md border border-rule bg-paper-sunken p-2"
        >
          {stats.pieces.map((piece, index) => (
            <span
              key={`${String(index)}-${piece.token}`}
              className={
                piece.raw
                  ? 'rounded-sm border border-dashed border-rule-strong px-1.5 py-0.5 font-mono text-xs text-ink-muted'
                  : 'rounded-sm border border-rule-strong bg-paper-raised px-1.5 py-0.5 font-mono text-xs text-ink'
              }
            >
              {SPACE_MARK.repeat(piece.lead.length)}
              {readable(piece)}
            </span>
          ))}
        </div>

        {/* The boxes above are silent for anyone not looking at them, and the
            three counts are the whole lesson, so this is the live region. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {stats.pieces.length === 0
            ? TEXT.empty
            : [
                TEXT.counts(stats.characters, stats.words, stats.pieces.length),
                TEXT.perPiece(stats.charactersPerPiece),
                stats.unlistedCharacters > 0
                  ? TEXT.unlisted(stats.unlistedCharacters, stats.rawPieces)
                  : '',
                TEXT.spoken(labels),
              ]
                .filter((sentence) => sentence !== '')
                .join(' ')}
        </p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={inputId} className="text-sm font-medium text-ink">
            {TEXT.inputLabel}
          </label>

          <input
            id={inputId}
            type="text"
            value={text}
            maxLength={MAX_LENGTH}
            aria-describedby={descriptionId}
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-md border border-rule-strong bg-paper-raised px-2.5 py-1.5 font-mono text-sm text-ink"
            onChange={(event) => {
              setText(event.target.value);
            }}
          />

          <p id={descriptionId} className="text-xs text-ink-faint">
            {TEXT.inputDescription}
          </p>
        </div>

        <SegmentedControl<PresetId | ''>
          label={TEXT.presetLabel}
          value={selected}
          onChange={(id) => {
            if (id !== '') setText(PRESETS[id].text);
          }}
          options={PRESET_IDS.map((id) => ({
            value: id,
            label: PRESETS[id].label,
          }))}
        />

        <p className="text-xs text-ink-faint">{TEXT.listNote(MERGES.length)}</p>
      </div>
    </InstrumentPanel>
  );
}
