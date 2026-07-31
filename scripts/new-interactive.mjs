#!/usr/bin/env node
/**
 * Scaffold an interactive (§3.4).
 *
 * Creates the component folder, seeds its copy entry, and registers a live demo
 * on /gallery — so the very first thing a new interactive does is show up
 * somewhere a reviewer can poke at it, rather than sitting unreferenced until
 * someone remembers to wire it in.
 *
 * Usage: pnpm new:interactive <Name>
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { argv, exit } from 'node:process';

const NAME_PATTERN = /^[A-Z][A-Za-z0-9]*$/;
const COPY_FILE = 'src/copy/en.ts';
const COPY_MARKER =
  '    // new:interactive inserts above this line — do not remove.';
const GALLERY_FILE = 'src/pages/gallery.mdx';
const DEMOS_FILE = 'src/components/gallery/demos.tsx';

/** @param {string} message */
const fail = (message) => {
  console.error(`\n  ${message}\n`);
  exit(1);
};

const name = argv[2];

if (!name) fail('Usage: pnpm new:interactive <Name>');
if (!NAME_PATTERN.test(name)) {
  fail(
    `"${name}" is not a component name. Use PascalCase, letters and digits only — e.g. TokenizerPlayground.`,
  );
}

const dir = path.join('src/components/interactives', name);

const indexSource = `import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, Slider } from '../../primitives';
import { describe${name} } from './logic';

export interface ${name}Props {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

const DEFAULT_AMOUNT = 50;

/**
 * TODO: say in one sentence what this teaches. If you cannot, the instrument
 * is not ready — an interactive that demonstrates several things at once
 * teaches none of them.
 */
export function ${name}({ title, lead }: ${name}Props = {}) {
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const copy = ui.interactives.${name};

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setAmount(DEFAULT_AMOUNT);
      }}
    >
      <div className="flex flex-col gap-4">
        <Slider label="Amount" value={amount} onChange={setAmount} />
        <p className="text-ink-muted text-sm">{describe${name}(amount)}</p>
      </div>
    </InstrumentPanel>
  );
}
`;

const logicSource = `/**
 * Pure logic for ${name}, kept out of the view so it can be tested directly
 * (§3.3). Anything with a rule worth getting right belongs here.
 *
 * Randomness, if you need it, must be seedable — an instrument that behaves
 * differently on each visit cannot be reasoned about or tested.
 */

/** TODO: replace with whatever this instrument actually computes. */
export function describe${name}(amount: number): string {
  return \`Amount is \${String(amount)}.\`;
}
`;

const testSource = `import { describe, expect, it } from 'vitest';

import { describe${name} } from './logic';

describe('describe${name}', () => {
  it('describes the current amount', () => {
    expect(describe${name}(50)).toContain('50');
  });

  // TODO: test the edges — zero, the maximum, and whatever this instrument
  // treats as a special case.
});
`;

async function insertCopyEntry() {
  const source = await readFile(COPY_FILE, 'utf8');

  if (source.includes(`    ${name}: {`)) {
    console.log(`  copy entry for ${name} already exists, leaving it alone`);
    return;
  }

  if (!source.includes(COPY_MARKER)) {
    fail(`Could not find the insertion marker in ${COPY_FILE}.`);
  }

  const entry = `    ${name}: {
      title: '${name}',
      lead: 'TODO: one line telling the reader what to try.',
    },
`;

  await writeFile(COPY_FILE, source.replace(COPY_MARKER, entry + COPY_MARKER));
}

async function registerDemo() {
  const demos = await readFile(DEMOS_FILE, 'utf8');
  if (!demos.includes(`from '../interactives/${name}/index'`)) {
    await writeFile(
      DEMOS_FILE,
      `${demos}\nexport { ${name} } from '../interactives/${name}/index';\n`,
    );
  }

  const gallery = await readFile(GALLERY_FILE, 'utf8');
  if (gallery.includes(`<${name} `)) return;

  const withImport = gallery.replace(
    "} from '../components/gallery/demos';",
    `} from '../components/gallery/demos';\nimport { ${name} } from '../components/gallery/demos';`,
  );

  await writeFile(
    GALLERY_FILE,
    `${withImport}\n## ${name}\n\nTODO: say what this instrument teaches.\n\n<${name} client:visible />\n`,
  );
}

await mkdir(dir, { recursive: true });
await writeFile(path.join(dir, 'index.tsx'), indexSource, { flag: 'wx' }).catch(
  () => {
    fail(
      `${dir}/index.tsx already exists. Pick another name or delete it first.`,
    );
  },
);
await writeFile(path.join(dir, 'logic.ts'), logicSource, { flag: 'wx' });
await writeFile(path.join(dir, 'logic.test.ts'), testSource, { flag: 'wx' });

await insertCopyEntry();
await registerDemo();

console.log(`
  Created ${dir}/
    index.tsx      the view — composes primitives, never its own controls
    logic.ts       the rules, pure and testable
    logic.test.ts  start here

  Registered a live demo on /gallery.

  Next:
    1. Replace the TODOs, starting with the one thing this teaches.
    2. pnpm test && pnpm budgets
    3. Check it on /gallery with the keyboard only.
`);
