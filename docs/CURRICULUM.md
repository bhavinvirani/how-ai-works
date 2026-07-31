# Curriculum

The unit inventory for the whole site: what gets taught, in what order, grouped
into which Parts, under which slugs.

**Status: signed off 2026-07-31.** Porting is unblocked (PLAN §2.4). The
grouping below becomes the `part` enum in `src/content.config.ts`, and these
slugs become filenames, URLs, Pagefind keys, progress-store keys, and the tokens
every other unit's frontmatter references. The slugs are a one-way door; the
Part grouping is not (see _What changes now this is signed off_).

Source: `reference/how-ai-works.html` — 60 topics in 8 Parts, which is the
source of truth for **coverage only**. Every line of prose is re-taught from
scratch (hard rule 4).

---

## What was signed off

Four decisions, all taken as recommended:

1. **Sixteen Parts instead of the artifact's eight.** Same 60 units, same
   sequence, more chapter breaks. §_The shape_.
2. **The slug scheme** — the canonical term where one exists, a plain concept
   phrase where none does, acronyms kept only where the acronym _is_ what people
   search for. §_Slugs_.
3. **The pilot is `why-rules-fail` + `model-as-dials`, shipped as one PR** — not
   Tokenization, and not a single unit. §_The pilot_.
4. **An instrument is earned, not assumed** — target roughly 35, not the 56 the
   per-unit analysis proposed. §_The instrument rule_.

Two smaller placement questions were left open on purpose and are decided when
their slice is written, not before: where `embeddings` sits, and whether
`positional-encoding` comes before or after `multi-head-attention`. Both are in
§_Still open_.

Everything else in here is derived, verified, and did not need a decision.

---

## The shape

Sixteen Parts. The artifact's eight, cut where a Part was doing two jobs at
once, and left alone where it was not.

The artifact's own Parts are 4, 11, 7, 12, 7, 12, 5 and 2 units. Three of them
hold 35 of the 60 units between them. That is fine in a single scrolling page
with a filter box — which is what the artifact is — and it is not fine in a
generated sidebar, which is what we are building. A reader nine units into a
twelve-unit chapter has no landmark, and "Part 4 of 8" stops meaning anything
about how far through they are.

Cutting those three Parts is most of the change. `how-machines-learn` (11) was
the training mechanism, the kinds of supervision, and the ways evaluation lies —
three different questions. `language` (12) was the problem, the mechanism, and
the behaviour of the resulting models. `getting-good-answers` (12) was
prompting, retrieval, tools, and safety. Each split falls on a seam that was
already there.

**The counter-case, so it is on the record.** `part` is the only closed
`z.enum` in the schema and is named in all 60 frontmatter files, so more values
means more boundaries that can later turn out to be wrong. The reason that cost
is acceptable: `part` does not appear in any URL. `unitHref` is
`/units/${id}` — Part is used for sidebar grouping, `/map` clustering and
`/progress` roll-ups, and nothing else. Regrouping later is a frontmatter edit
plus an enum edit, with no link rot and no redirects. Slugs are the thing that
cannot be taken back, which is why they get their own section and this does not.

Two units move between Parts, and one deliberately does not:

| Unit                | Artifact home         | New home                        | Why                                                                                                                                                                                                       |
| ------------------- | --------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `feature-hierarchy` | before `forward-pass` | after `backpropagation`         | Its central claim — that the hierarchy assembles itself because that arrangement makes the wrongness score smallest — cannot be honestly made to a reader who has not yet watched blame travel backwards. |
| `multimodal-models` | Small, fast, cheap    | closes The idea that cracked it | It is not about being small, fast or cheap. It is the same transformer eating a different kind of piece, which is the point the Part it now closes has just spent four units making.                      |
| `embeddings`        | closes Part 3         | closes Part 3 — unchanged       | The one placement argued both ways and left alone. See _Still open_.                                                                                                                                      |

---

## The inventory

Sixty units. Effort is **S** (prose plus an existing pattern), **M** (one new
diagram and one straightforward island), **L** (a bespoke instrument, real
maths, or teaching that goes well beyond what the artifact supplies).
"Instrument" is the analysis's verdict on the artifact's demo: _rebuild +_ means
the idea is sound and the execution needs improving, **new** means the artifact
has nothing usable here, and — means a diagram teaches it better than an
instrument would.

### Why any of this exists

`why-this-exists` &middot; 4 units &middot; 3 instruments &middot; 0 at L effort

| #   | Unit                      | What it teaches                                                                                                                                        | Effort | Instrument                 |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | -------------------------- |
| 1   | `why-rules-fail`          | Some tasks have no rule anyone can write down — every hand-written rule you add breaks something real, which is why machines must learn from examples. | M      | `SpamRuleWriter` rebuild + |
| 2   | `model-as-dials`          | A model is a box of adjustable numbers; tuning them until the answers stop being wrong is all that learning means — the rest is scale.                 | M      | `DialTuner` rebuild +      |
| 3   | `training-data`           | Everything a machine learns from is a table of examples and measurements; which column is the answer is a choice you make, not a fact about the data.  | M      | `LabelPicker` **new**      |
| 4   | `ai-ml-and-deep-learning` | AI, machine learning, deep learning and generative AI are four rings inside one another — knowing which ring a system sits in predicts how it fails.   | S      | —                          |

### How a machine learns

`the-learning-loop` &middot; 4 units &middot; 4 instruments &middot; 0 at L effort

| #   | Unit               | What it teaches                                                                                                                                          | Effort | Instrument                     |
| --- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------ |
| 5   | `training-loop`    | Learning is one four-step cycle — guess, compare, blame, nudge — run millions of times. No single nudge matters; the accumulation does.                  | M      | `TrainingLoopRunner` rebuild + |
| 6   | `loss-function`    | A machine can only improve against one number. Whatever you choose to score is exactly what it becomes good at — nothing else.                           | M      | `ScoringRulePicker` **new**    |
| 7   | `gradient-descent` | The machine cannot see where good settings are. It only feels the slope where it stands and steps downhill — so training is a search, not a calculation. | M      | `FoggyDescentWalk` rebuild +   |
| 8   | `learning-rate`    | Step size decides whether training settles, crawls, or blows up — and it is a setting a human picks, not something the machine learns.                   | M      | `StepSizeRace` **new**         |

### Where the answers come from

`kinds-of-learning` &middot; 4 units &middot; 3 instruments &middot; 1 at L effort

| #   | Unit                       | What it teaches                                                                                                                                                                  | Effort | Instrument                     |
| --- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------ |
| 9   | `supervised-learning`      | When every example carries a human-written correct answer, the loop has something to compare against — and producing those answers by hand is the ceiling on what you can build. | S      | —                              |
| 10  | `unsupervised-learning`    | With no answers, a machine can only find structure — groups, oddities, simplifications — and whether that structure means anything is a human judgement.                         | M      | `ClusterFinder` **new**        |
| 11  | `reinforcement-learning`   | With no answers and no dataset, a learner acts, receives a score afterwards, and must work out which of its decisions earned it.                                                 | M      | `ExploreExploitBandit` **new** |
| 12  | `self-supervised-learning` | Hide part of ordinary data and ask the machine to reconstruct it — the answer key was inside the data all along, in unlimited supply and free.                                   | L      | `FreeLabelMaker` rebuild +     |

### When a good score lies

`when-scores-lie` &middot; 3 units &middot; 3 instruments &middot; 1 at L effort

| #   | Unit                   | What it teaches                                                                                                                                            | Effort | Instrument                  |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------- |
| 13  | `overfitting`          | A model that scores perfectly on what it studied may have memorised noise. Both too simple and too flexible fail — only the middle survives new data.      | L      | `FlexibilityDial` rebuild + |
| 14  | `train-test-split`     | You cannot judge a machine on what it studied, so data is split three ways — and the third pile exists because you, not the model, contaminate the second. | M      | `LeakageSplitter` **new**   |
| 15  | `precision-and-recall` | One accuracy number can hide a useless machine. The two ways of being wrong cost different amounts, and choosing between them is a human decision.         | M      | `ThresholdMatrix` rebuild + |

### What the machine is made of

`inside-the-machine` &middot; 7 units &middot; 7 instruments &middot; 3 at L effort

| #   | Unit                | What it teaches                                                                                                                                             | Effort | Instrument                 |
| --- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------- |
| 16  | `neuron`            | A neuron multiplies each input by a tunable weight, adds them up, and bends the result — that bend is why stacking neurons buys anything.                   | M      | `TasteNeuron` **new**      |
| 17  | `layers`            | Neurons side by side make a layer; every connection between two layers is one parameter, which is where billion-parameter counts come from.                 | M      | `ParameterCounter` **new** |
| 18  | `forward-pass`      | Using a model is one fixed sweep from input to output: same work for an easy question as a hard one, and no going back.                                     | M      | `FixedWorkMeter` **new**   |
| 19  | `backpropagation`   | One backward sweep hands every parameter its share of the blame for a wrong answer, at about the cost of one forward pass.                                  | L      | `BlameFlow` **new**        |
| 20  | `feature-hierarchy` | Nobody programs the features. Training makes early layers find crude fragments and later layers combine them into meaningful things, in images and in text. | L      | `FeatureLadder` rebuild +  |
| 21  | `why-depth-works`   | Depth was not a new idea; data, GPUs and a few fixes made it work — and depth pays off by reusing parts rather than memorising wholes.                      | M      | `ReuseCounter` **new**     |
| 22  | `embeddings`        | Give every word a position so that distance means similarity; those positions are learned from company kept, and directions in the space carry meaning.     | L      | `MeaningMap` rebuild +     |

### Why language broke everything

`language-problem` &middot; 3 units &middot; 3 instruments &middot; 0 at L effort

| #   | Unit                   | What it teaches                                                                                                                                    | Effort | Instrument                |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------- |
| 23  | `why-language-is-hard` | Language resisted machines because meaning depends on word order, on distance, and sometimes on a word that has not arrived yet.                   | M      | `PronounFlip` **new**     |
| 24  | `tokenization`         | Models read a fixed list of subword chunks, not letters and not words — which is why billing, spelling and language cost all behave oddly.         | M      | `TokenSplitter` rebuild + |
| 25  | `recurrent-networks`   | Reading a sentence word by word through one fixed-size memory means early words fade — and forces the machine to work strictly one step at a time. | M      | `MemorySqueeze` rebuild + |

### The idea that cracked it

`the-transformer` &middot; 5 units &middot; 5 instruments &middot; 2 at L effort

| #   | Unit                   | What it teaches                                                                                                                                      | Effort | Instrument                  |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------- |
| 26  | `attention`            | Every word asks a question, every word offers a label, and each word rebuilds its meaning as a blend of whichever contents matched best.             | L      | `AttentionMap` rebuild +    |
| 27  | `multi-head-attention` | One round of attention can only track one kind of relationship, so models run many in parallel — and nobody assigns which does what.                 | M      | `MultiHeadLanes` **new**    |
| 28  | `positional-encoding`  | Attention compares words without any notion of order, so a sentence arrives as a bag of words unless position is stamped in beforehand.              | M      | `OrderBlindness` **new**    |
| 29  | `transformers`         | A transformer is attention plus a shortcut, a rescale, and a per-word thinking step — stacked dozens of times, with a fixed number of passes always. | L      | `TransformerTrace` **new**  |
| 30  | `multimodal-models`    | The model never learns to see. Pictures and sound get cut up and translated into the same kind of numbers it already reads.                          | M      | `PatchGridExplorer` **new** |

### What a large model does

`large-models` &middot; 5 units &middot; 4 instruments &middot; 0 at L effort

| #   | Unit              | What it teaches                                                                                                                                       | Effort | Instrument                      |
| --- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------- |
| 31  | `llm`             | An LLM is one large transformer doing exactly one operation — score every vocabulary piece for what comes next — repeated.                            | S      | —                               |
| 32  | `text-generation` | The model writes one piece, appends it, re-reads everything, and writes the next — so it cannot plan ahead and cannot take anything back.             | M      | `NextPieceLoop` rebuild +       |
| 33  | `temperature`     | The model produces percentages, and one dial controls how sharply those percentages are treated before a choice is drawn from them.                   | M      | `TemperatureDial` rebuild +     |
| 34  | `context-window`  | There is no memory between messages; the whole conversation is resent every time, and all of it must fit one fixed-size window.                       | M      | `ContextBudget` **new**         |
| 35  | `scaling-laws`    | Performance improved predictably with size, data and training — but some abilities appeared abruptly, and whether that is real is still argued about. | M      | `EmergenceOrArtefact` rebuild + |

### Turning a model into an assistant

`building-an-assistant` &middot; 4 units &middot; 4 instruments &middot; 1 at L effort

| #   | Unit          | What it teaches                                                                                                              | Effort | Instrument                            |
| --- | ------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------- |
| 36  | `pretraining` | One enormous, one-time pass over heavily filtered text gives a model everything it knows — and freezes it there.             | M      | `CorpusFilterInstrument` **new**      |
| 37  | `base-models` | A pretrained model knows the answer but has no idea it is being asked; answering is a separate, later, learned habit.        | M      | `ThreeStagesInstrument` rebuild +     |
| 38  | `fine-tuning` | Fine-tuning changes how a model behaves, not what it knows — facts belong in the prompt, not baked into the dials.           | M      | `FineTuneOrPromptSorter` **new**      |
| 39  | `rlhf`        | Nobody can write down a good answer, but anyone can pick the better of two — and those picks become the model's personality. | L      | `PreferenceRaterInstrument` rebuild + |

### Why it behaves like that

`assistant-behaviour` &middot; 3 units &middot; 3 instruments &middot; 1 at L effort

| #   | Unit                | What it teaches                                                                                                              | Effort | Instrument                             |
| --- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------- |
| 40  | `reasoning-models`  | Producing text is the only way this machine can spend more effort, so thinking models are trained to write before answering. | L      | `ThinkingBudgetInstrument` **new**     |
| 41  | `hallucination`     | Nothing in the machine ever checks a fact, so true and invented answers are produced by exactly the same process.            | M      | `SpotTheFabricationInstrument` **new** |
| 42  | `why-models-refuse` | Refusal is trained into the same dials as everything else, not bolted on — which is why it is fuzzy and pushable.            | M      | `RefusalBoundaryInstrument` **new**    |

### Asking well

`asking-well` &middot; 3 units &middot; 3 instruments &middot; 0 at L effort

| #   | Unit                 | What it teaches                                                                                                            | Effort | Instrument                      |
| --- | -------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------- |
| 43  | `prompting`          | Your prompt is the opening of a document the model must finish, so narrowing what counts as a plausible ending steers it.  | M      | `PromptLeverBoard` **new**      |
| 44  | `few-shot-prompting` | A few worked examples pin format and range better than any description, and the awkward example is the one that saves you. | M      | `ExampleSetBuilder` rebuild +   |
| 45  | `chain-of-thought`   | Written working is the extra computation: every token is another pass, and the steps stay visible for later steps to use.  | M      | `ThinkingBudgetMeter` rebuild + |

### Giving it your own documents

`your-own-documents` &middot; 4 units &middot; 4 instruments &middot; 1 at L effort

| #   | Unit                  | What it teaches                                                                                                                                | Effort | Instrument                         |
| --- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------- |
| 46  | `rag`                 | Look the answer up first and answer from what you found; the search, not the model, sets the ceiling.                                          | L      | `RetrievalPipeline` **new**        |
| 47  | `chunking`            | How you cut a document decides what can ever be found; a passage that never says what it's about is invisible.                                 | M      | `ChunkCutter` **new**              |
| 48  | `vector-search`       | Meaning-search finds passages sharing no words with the question, and misses exact strings, which is why real systems also run keyword search. | M      | `MeaningVsKeywordSearch` rebuild + |
| 49  | `context-engineering` | The window is a budget shared by instructions, history, retrieved text and the answer; spending it well beats having more of it.               | M      | `ContextBudgetBoard` rebuild       |

### Letting it act

`letting-it-act` &middot; 3 units &middot; 2 instruments &middot; 1 at L effort

| #   | Unit       | What it teaches                                                                                                     | Effort | Instrument                     |
| --- | ---------- | ------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------ |
| 50  | `tool-use` | The model can only ask for a function to be run; your code decides whether to run it, and holds every permission.   | M      | `ToolCallRelay` **new**        |
| 51  | `mcp`      | One agreed protocol turns apps-times-systems bespoke integrations into apps-plus-systems pieces, each written once. | S      | —                              |
| 52  | `agents`   | An agent is a model choosing its own next step in a loop; the power and the danger both come from that choice.      | L      | `AgentTraceExplorer` rebuild + |

### Knowing whether it works

`does-it-work` &middot; 2 units &middot; 2 instruments &middot; 2 at L effort

| #   | Unit               | What it teaches                                                                                                               | Effort | Instrument                 |
| --- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------- |
| 53  | `evaluation`       | Without a fixed set of cases scored on every change, you are not improving the system, only rearranging it.                   | L      | `EvalScoreboard` **new**   |
| 54  | `prompt-injection` | The model cannot tell your instructions from instructions hidden in text it was given, so limit what it can do, not just say. | L      | `InjectionSandbox` **new** |

### Small enough, fast enough, cheap enough

`small-fast-cheap` &middot; 4 units &middot; 4 instruments &middot; 2 at L effort

| #   | Unit               | What it teaches                                                                                                                                   | Effort | Instrument                      |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------- |
| 55  | `small-models`     | For a narrow job a small model you run yourself is usually good enough, and buys privacy, speed and a far smaller bill.                           | M      | `CascadeRouterLab` **new**      |
| 56  | `distillation`     | A teacher model hands over its whole ranked guess-list, not just the right answer, and the near-misses are what the student actually learns from. | L      | `TeacherStudentBench` **new**   |
| 57  | `quantization`     | Spending fewer binary digits on each dial shrinks the model and speeds it up — same dials, rounded — and the damage lands unevenly.               | M      | `PrecisionDial` rebuild +       |
| 58  | `cost-and-latency` | Reading your prompt happens all at once and is cheap; writing the answer happens one token at a time and is what you pay for.                     | L      | `TokenBudgetCalculator` **new** |

### The whole picture

`the-whole-picture` &middot; 2 units &middot; 2 instruments &middot; 1 at L effort

| #   | Unit                  | What it teaches                                                                                                                          | Effort | Instrument                  |
| --- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------- |
| 59  | `what-ai-cannot-do`   | Every failure of these systems is predictable from how they were built. The limits are consequences of the mechanism, not mysteries.     | M      | `PredictTheFailure` **new** |
| 60  | `how-it-all-connects` | The whole guide is one idea repeated — guess the next piece. Everything else exists to work around what that single operation cannot do. | L      | `SpineTracer` **new**       |

---

## Slugs

The filename is the id, the id is the URL, and there is no `id` field in the
schema to hide behind. A slug is also the Pagefind index key, the progress-store
key, and the token every other unit's frontmatter uses to reference this one.
Renaming one later breaks external links permanently. So the rule is written
down rather than applied by feel:

> **Use the canonical term where the field has one. Use a short plain concept
> phrase where it does not. Never use the unit title** — titles are editorial,
> and they will change.

The canonical term wins even when it is jargon, because the slug is a search
target rather than teaching copy. `backpropagation`, `overfitting`,
`positional-encoding`, `quantization` are all what a reader would type. The
title above them is still plain English; the two jobs are separate.

**Acronyms survive only where the acronym is the search term.** That is
`llm`, `rag`, `rlhf`, `mcp` — nobody searches "preference training". Every other
artifact acronym expands: `tok` → `tokenization`, `ft` → `fine-tuning`,
`ssl` → `self-supervised-learning`, `vdb` → `vector-search`, `ctxwin` →
`context-window`.

**One collision worth catching now.** The artifact's closing topic is `map`, and
the site already serves the concept map at `/map`. `/units/map` beside `/map` is
legal, builds fine, and confuses every reader who lands on the wrong one. It
becomes `how-it-all-connects`. Generalised: **no unit slug may equal a top-level
route segment** — today `map`, `gallery`, `progress`, `units`, `404`, and
`search` once Pagefind lands. Nothing in the build catches this; it is on
review.

---

## Prerequisites and connections

Both come from the artifact's own link graph, which is in better shape than
expected: 168 links, no dangling targets, and all 76 `builds on` / `back to`
links pointing strictly backwards in reading order.

- `builds on` and `back to` → **`prerequisites`**. Genuinely required reading.
- `leads to`, `later`, `also see` → **`connections`**. Related, no ordering
  meaning.

The `why` lines are the one thing that does **not** carry over. They are prose,
and prose is re-taught (hard rule 4). Each `why` gets rewritten when its unit is
ported.

Under the ordering proposed here: **75 prerequisite edges, 92 connections, zero
forward references, zero cycles.**

**One declared override.** Moving `feature-hierarchy` after `backpropagation`
reverses the artifact's `forward-pass builds on feature-hierarchy` edge. A
forward pass needs to know what a layer _is_, not what layers _learn_, so this
is demoted from a prerequisite to a connection. It is the only edge changed, and
it is deliberate — a future contributor checking the port against the artifact
will find the disagreement and should not "fix" it.

**Forward connections get trimmed on the way in, and backfilled later.** A unit
cannot reference a unit that does not exist yet — `reference('units')` fails the
build, which is exactly what it is for. So each slice lands with its
forward-pointing connections removed, and the slice that lands the target adds
them back. Roughly 47 links across Phase 2 are in this state at any time. This
is bookkeeping, not risk, but it has to be written in each PR description or it
gets lost.

---

## Phase 2 slice plan

One PR per Part, except where a Part is too big to review honestly. The sizing
rule is **≤ 4 units and ≤ 2 L-effort units per PR** — and note it is effort, not
unit count, that decides: `does-it-work` is two units and is one of the heaviest
PRs in the phase.

| Slice    | Units                                                      | Notes                                                                                                                                                                                                                       |
| -------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2-enum` | —                                                          | The `part` enum, `PART_LABELS`, and `new-unit.mjs`. Zero content, lands first.                                                                                                                                              |
| `2a`     | Why any of this exists (4)                                 | The pilot is the first half of this.                                                                                                                                                                                        |
| `2-nav`  | —                                                          | Generated sidebar. Lands after the **first** Part, not the last.                                                                                                                                                            |
| `2b`     | How a machine learns (4)                                   |                                                                                                                                                                                                                             |
| `2c`     | Where the answers come from (4)                            |                                                                                                                                                                                                                             |
| `2d`     | When a good score lies (3)                                 |                                                                                                                                                                                                                             |
| `2e-i`   | `neuron`, `layers`                                         | Builds `LayerStackDiagram`, reused by four units.                                                                                                                                                                           |
| `2e-ii`  | `forward-pass`, `backpropagation`                          | Heaviest slice in the Part; `BlameFlow`'s arithmetic is the single largest piece of logic in it.                                                                                                                            |
| `2e-iii` | `feature-hierarchy`, `why-depth-works`, `embeddings`       | Illustration-heavy; carries the only committed data file (2-D word coordinates).                                                                                                                                            |
| `2f`     | Why language broke everything (3)                          |                                                                                                                                                                                                                             |
| `2g-i`   | `attention`, `multi-head-attention`, `positional-encoding` |                                                                                                                                                                                                                             |
| `2g-ii`  | `transformers`, `multimodal-models`                        |                                                                                                                                                                                                                             |
| `2h-i`   | `llm`, `text-generation`, `temperature`                    |                                                                                                                                                                                                                             |
| `2h-ii`  | `context-window`, `scaling-laws`                           |                                                                                                                                                                                                                             |
| `2i`     | Turning a model into an assistant (4)                      |                                                                                                                                                                                                                             |
| `2j`     | Why it behaves like that (3)                               |                                                                                                                                                                                                                             |
| `2k`     | Asking well (3)                                            |                                                                                                                                                                                                                             |
| `2l`     | Giving it your own documents (4)                           |                                                                                                                                                                                                                             |
| `2m`     | Letting it act (3)                                         |                                                                                                                                                                                                                             |
| `2n`     | Knowing whether it works (2)                               | **Under-sized by count, over-sized by effort.** Both units are L, both are among the most consequential on the site, and the artifact supplies ~320 words each with no demo and no diagram. This is authoring, not porting. |
| `2o`     | Small enough, fast enough, cheap enough (4)                |                                                                                                                                                                                                                             |
| `2p`     | The whole picture (2)                                      | Lands last by definition — `how-it-all-connects` references everything.                                                                                                                                                     |
| `2-meta` | —                                                          | `/map`, Pagefind, sitemap, 404. Depends on the schema, not the unit count, so it can land early and grow.                                                                                                                   |

Twenty-one content PRs plus three plumbing PRs.

**Four components are shared across slices and must be built once, in the
earliest slice that needs them**, or they get built two and three times:
`LayerStackDiagram` (`layers`, `forward-pass`, `backpropagation`,
`feature-hierarchy`), the attention chip view (`attention`,
`multi-head-attention`), the probability-bar view (`text-generation`,
`temperature`), and the context-budget board (`context-window`,
`context-engineering` — one island with two presets, decided now rather than
after both PRs exist).

---

## The pilot

**`why-rules-fail` and `model-as-dials`, together, as one PR.**

This overrules PLAN §8's Tokenization suggestion, and it was not a close call —
all three independent proposals landed on `why-rules-fail` without prompting.

**Why not Tokenization.** It sits at position 24 in the reading order. Its
prerequisites will not exist for months, so it would ship `prerequisites: []` —
frontmatter that is false rather than merely empty — with all three of its
connections trimmed, and it would put one published unit in the middle of a Part
where the first sidebar render and the first `/map` render would both be
misleading. It is a good unit and a bad first one.

**Why a pair rather than one unit.** This is the part that was checked against
the code rather than reasoned about. `ConnectionsFooter.astro` gates its entire
body on `hasAnything = connections.length > 0 || prerequisites.length > 0`, so a
single unit with empty arrays renders **no footer markup at all** — neither
`<nav aria-label>` landmark is emitted, which is precisely what the axe pass
would otherwise check. `resolvePrerequisites` and `resolveConnections` both
flatMap over empty arrays and are never called. `assertAcyclic` walks zero edges.
`docs/HANDOFF.md` records the unit route and `ConnectionsFooter` as "wired and
typechecked but never rendered end to end" — a one-unit pilot leaves that exactly
as true as it found it.

Adding `model-as-dials` costs one more island and buys a real
`prerequisites: [why-rules-fail]` edge, a real connection with a real `why`, a
two-unit sidebar group, and the `DialTuner`/`DialMachine` pattern that
`training-loop` and `loss-function` both inherit.

**Why these two specifically.** Position 1 and 2, so `prerequisites: []` on the
first one is the truth. No maths. No bespoke SVG inside either island —
`SpamRuleWriter` is Toggles over a list, `DialTuner` is two Sliders over a
scatter plot. When this PR goes wrong, it will be the pipeline's fault and not
the instrument's, which matters when a single PR is exercising the unit route,
the connections footer, the cycle check, the budgets gate and the axe gate for
the first time.

Ship `2-enum` before it, so the one-way enum decision lands in a diff with no
prose in it and cannot get tangled in a pedagogy review.

---

## The instrument rule

The per-unit analysis proposed an instrument for 56 of 60 units. The artifact
has 31. Every one of the 56 is individually justified, and the total was not:
each carries the full contract — composed from primitives, zero required props,
seedable, keyboard operable, axe-clean, reduced-motion, `logic.ts` with tests,
budget, `StaticFallback` where drag or hover matters. At a day each that is a
quarter of work in islands alone, before any prose or diagrams.

So the **Instrument column in the inventory above is a proposal, not a
commitment**, and the rule that decides it is:

> An instrument has to teach something the prose and the diagram cannot.

Re-run the verdicts against that rule per slice, expecting to land nearer 35.
The four units already marked "—" (`ai-ml-and-deep-learning`,
`supervised-learning`, `llm`, `mcp`) are the model for what a good "no" looks
like: each is a distinction or a definition, and a diagram makes the distinction
better than a control would.

Where an instrument is dropped, the unit still gets a diagram — the _See it_
step of the skeleton is not optional, and cutting instruments is not licence to
cut both.

---

## Still open

Two placement questions, deliberately not settled at sign-off. Both are local,
both are cheap to change while their Part is unwritten, and both are worth
deciding with the actual prose in front of you rather than in the abstract.

**1. Does `embeddings` stay in _What the machine is made of_, or move into the
language Part after `tokenization`?**

Staying is what is proposed above. The argument for moving: the reader currently
learns "each **word** becomes a position", then two units later learns the model
does not read words but pieces — a small unlearn, and moving it after
`tokenization` puts the pipeline in its true order and shortens the edges to
`attention` and `vector-search`, which are its real consumers.

The argument for staying, which is why it is the proposal: the Part is called
_what the machine is made of_, and what the numbers inside actually mean is the
right last word for it. More concretely, moving it inverts the artifact's
`tokenization builds on embeddings` edge, and once inverted, anyone who later
restores the obvious `why-language-is-hard builds on embeddings` edge creates a
three-node cycle. `assertAcyclic` would fail the build rather than ship it, so
this is a trap rather than a disaster — but it is a trap that only springs for
the contributor conscientious enough to check the port against the source.

If it moves, the re-pointed edge needs a **do-not-restore** note in the same
place this one is recorded.

**2. `attention → multi-head-attention → positional-encoding`, or
`attention → positional-encoding → multi-head-attention`?**

Order-blindness is a flaw in _single-head_ attention, which argues for fixing it
before multiplying it. The counter, which is what is proposed: multi-head is
"attention again, in parallel" and belongs beside attention, while positional
encoding is a correction applied during assembly and lands naturally right
before `transformers`. Genuinely close; worth deciding on purpose rather than
inheriting.

---

## What changes now this is signed off

| File                    | Change                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/content.config.ts` | Replace the placeholder 4-value `PARTS` with these 16, and `PART_LABELS` with the labels above.                                                              |
| `scripts/new-unit.mjs`  | Holds its **own** hardcoded copy of `PARTS`. It will silently reject valid Parts until updated — the two lists must be reconciled, ideally by importing one. |
| `docs/HANDOFF.md`       | Mark the `part` enum reconciled; carry the instrument rule, the two still-open placements, and the two findings below.                                       |

---

## Two findings that affect the build

Neither is caused by this document; both bite the moment Phase 2 starts.

**1. A published unit linking to a draft emits a link to a page that was never
generated.** `src/pages/units/[...slug].astro` filters drafts into `visible`,
then passes the **unfiltered** `units` array as props. `byId` is built from that,
so a connection to a draft resolves the draft's title and emits
`href="/units/<draft>"` — and `getStaticPaths` never generated it.
`resolve.ts`'s own comment says a missing entry means the unit "was filtered out
downstream (a draft, say)", which is not true of the current route. This will
surface in CI as a lychee "broken internal link", not as a Zod reference error,
which is a much more confusing diagnostic to meet for the first time nineteen
PRs into a port. Fix: pass `visible`. One line, and it makes `resolve.ts`'s
documented behaviour real.

**2. `/map` cannot colour nodes by Part.** PLAN §2.5 specifies nodes "colored by
Part". `tokens.css` ships exactly two categorical accents — magenta and teal —
plus three semantic colours that already mean success, warning and danger and
cannot be repurposed. Sixteen Part colours would need sixteen new tokens, each
WCAG-checked against `paper`, `paper-raised` and `paper-sunken`, and hard rule 9
forbids carrying meaning by colour alone regardless. `/map` should encode Part by
**label and cluster position**, with colour as a secondary cue at most. Worth
recording before `2-meta` is built rather than after.

---

## How this was derived, and how to check it

The 60 topics, 8 Parts, 168 links, 31 demos and 13 diagrams were extracted
mechanically by evaluating the artifact's own topic-registration script — not
read out of it by eye — so no topic can be silently dropped or invented. The
proposed grouping was then checked programmatically for coverage, slug legality
against `new-unit.mjs`'s own `ID_PATTERN`, forward-pointing prerequisites, and
cycles.

Current result: **60/60 units assigned, 0 duplicate slugs, 0 forward
prerequisites, 0 cycles, 1 declared override.**

The pedagogical judgements — what each unit teaches, whether its demo survives
the interactive contract, effort — came from a per-Part reading of the source
and are recorded in the table above.
