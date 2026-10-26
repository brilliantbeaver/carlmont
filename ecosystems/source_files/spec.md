# BUILD SPEC — Ecosystems Study Guide (shared by all subagents)

Working folder (Write-tool absolute path):
`/Users/pmui/Library/Application Support/Claude/local-agent-mode-sessions/dda4ba46-f877-4f56-9eac-0ff3ef8b008d/2661bade-684d-477c-93df-628f9062242f/2fb364d8/outputs/`
Same folder in the bash sandbox: `/sessions/zealous-vigilant-wright/mnt/outputs/`

Read first: `source_brief.md` (what's in the class handouts — PRIMARY grounding) and `research_notes.md` (verified facts, traps).

Audience: 9th/10th grade biology student. Real test = 25 MC questions in 30 minutes, teacher wants students to know each term's **definition, importance, and identify it in context**.

---------------------------------------------------------------------
## 1. Study-guide section IDs (use EXACTLY these in each question's `review` field)

| Topic # | Topic | Section IDs |
|---|---|---|
| 1 | Earth Systems Science | `s1-ess` (what ESS is; closed system; sun/core as energy drivers), `s1-spheres` (atmo/hydro/bio/geo contents), `s1-interact` (sphere interactions e.g. wildfire, volcano) |
| 2 | Ecological Relationships | `s2-symbiosis` (symbiosis + mutualism/commensalism/parasitism), `s2-predprey` (predator/prey incl. cycles), `s2-competition` (inter vs intra), `s2-keystone` (keystone, trophic cascade, Atlas NP Gizmo) |
| 3 | Food Chains, Webs & Energy | `s3-trophic` (trophic levels, autotroph/heterotroph, herbivore/omnivore/carnivore), `s3-arrows` (food chain/web models, arrow direction, model strengths/weaknesses), `s3-decomposers` (decomposers, scavengers, detritivores, nutrient cycling), `s3-energy` (10% rule, metabolism → heat, energy pyramid, calculations) |
| 4 | Limiting Factors & Carrying Capacity | `s4-limiting` (limiting factors, bear/gull examples), `s4-density` (density-dependent vs -independent), `s4-growth` (exponential/J vs logistic/S, carrying capacity, what raises/lowers K), `s4-overshoot` (overshoot, decline, recovery, bean simulation, St. Matthew), `s4-cycles` (cyclical/periodic, lynx–hare) |
| 5 | Succession, Fragmentation & Fire | `s5-fragmentation`, `s5-primary`, `s5-secondary` (incl. tertiary), `s5-organisms` (pioneer species, climax community, residents/edge-dwellers/retired pioneers), `s5-fire` (crown vs surface vs ground fire, fire severity vs intensity, disturbances), `s5-czu` (CZU Lightning Complex, Big Basin, redwood adaptations, climate change) |
| 6 | Biodiversity | `s6-biodiversity` (definition, why it matters, sampling), `s6-richeven` (richness, evenness), `s6-relabund` (relative abundance calculations) |
| 7 | What is an Ecosystem? | `s7-ecosystem` (definition, levels of organization), `s7-equilibrium` (balance, resilience), `s7-biotic` (biotic vs abiotic) |
| 8 | Graphs | `s8-drymix` (DRY MIX, axes, IV/DV, constants), `s8-graphtypes` (line vs bar), `s8-reading` (trends, high/low, anomaly, what you can/can't conclude) |
| 9 | CER | `s9-cer` (claim, evidence, reasoning; strong vs weak) |

---------------------------------------------------------------------
## 2. Question JSON schema

Each question-writing agent writes ONE file: a JSON array of question objects. Validate with `python3 -c "import json;d=json.load(open('FILE'));print(len(d))"` in bash before finishing.

```json
{
  "id": "T4-03",                       // T<topic>-<nn> for drills; M-<nn> for mock test
  "topic": 4,                           // 1..9 (see table)
  "subtopic": "Density-dependent vs. density-independent",   // checklist item name
  "review": "s4-density",               // section id from table above
  "source": "Limiting Factors & Carrying Capacity worksheet", // which class handout it's grounded in, or "Standard HS ecology"
  "level": "core",                      // "core" (definition/recall), "apply" (identify in context / scenario), "challenge" (data, calc, multi-step)
  "figure": null,                       // null OR a figure id from the catalog below (string)
  "stem": "A late-spring cold front kills many newly hatched birds...",  // plain text; may include simple HTML: <b>, <i>, <br>, <sub>, <sup>, and <table class='qt'>…</table> for data tables
  "choices": ["...", "...", "...", "..."],   // exactly 4; similar length; no "all/none of the above"; no "A and B"
  "answer": 2,                          // 0-based index of correct choice
  "hint": "Ask yourself: does the effect depend on how crowded the population is?",   // a nudge that does NOT reveal the answer
  "explanation": "Correct: ... (2–4 sentences, teach the concept, connect to the handout)",
  "why_wrong": ["why choice 0 is wrong", "why choice 1 is wrong", "", "why choice 3 is wrong"],  // same length as choices; empty string at the correct index
  "trap": "Density-independent ≠ 'doesn't affect the population'"   // short name of the misconception tested, or null
}
```

Rules for writing:
- Ground every question you can in the class handouts (redwood food web cards, bean-rabbit simulation data, Atlas NP Gizmo, bear/gull limiting factors, Yosemite succession tables, Sampling Diversity community tables, habitat-fragmentation bird simulation, CZU/Big Basin). Use standard HS examples for the rest.
- Mirror the teacher's demand: **definition, importance, identify in context**. Mix ~35% core, ~45% apply, ~20% challenge.
- Distractors must be plausible and target REAL misconceptions (see research_notes "Likely Test Traps" and source_brief section F). Every wrong choice gets a specific `why_wrong`.
- Balance the correct-answer position: across your set, correct answers should be spread roughly evenly over indices 0–3 (shuffle!). Don't make the correct answer the longest choice systematically.
- Where the teacher's definition differs from textbooks (tertiary succession; cyclical vs periodic), use the TEACHER's framing and avoid questions whose answer hinges on a disputed nuance. Never write a question with two defensible answers.
- Keep stems ≤ ~70 words (data tables excepted). Grade 9 reading level. Use units in numbers.
- Do not reference figure letters/positions unless they are in the figure catalog below exactly as specified.
- Do not copy handout text verbatim for long passages; paraphrase.

---------------------------------------------------------------------
## 3. FIGURE CATALOG (SVG files go in `outputs/figs/<id>.svg`)

Question writers may set `"figure": "<id>"` and rely ONLY on the content described here. Figure agents must draw EXACTLY this content.

**Style guide for all SVGs** (figure agents):
- `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 H" width="100%" role="img" aria-label="...">` — width 720, height as needed (≈300–460). No fixed pixel width/height attributes other than width="100%". Include `<title>`.
- Font: `font-family="Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif"`; body labels 13–15px, titles 16–17px bold; min font 11px. All text must be legible when printed.
- Palette: ink #1f2937, muted #6b7280, grid #e5e7eb, forest green #2f855a, light green #c6f6d5, sky blue #3182ce, light blue #bee3f8, earth brown #8b5e34, sand #f6e7cb, fire orange #dd6b20, fire red #c53030, purple #6b46c1, gold #d69e2e, white #ffffff. Backgrounds transparent or very light (#f9fafb).
- Self-contained: no external fonts/images/scripts, no CSS classes that rely on outside stylesheets (inline attributes or an internal `<style>` scoped with unique class prefixes like `.f-kmodel-…`). No `<foreignObject>`.
- Arrowheads via `<marker>` with UNIQUE ids per file (prefix with figure id, e.g., `id="kmodel-arrow"`), because all SVGs will be inlined into one HTML page.
- Accessible: `aria-label` summarizing content.
- Must render correctly in Chrome and print well in grayscale (use labels, not color alone).

### Topic 1
- **`earth-spheres`** — Earth in the center; four labeled boxes around it: ATMOSPHERE (air, wind, weather, climate, clouds), HYDROSPHERE (oceans, rivers, glaciers & sea ice, groundwater/aquifers, soil moisture), BIOSPHERE (plants, animals, fungi, bacteria, algae), GEOSPHERE (rock, soil minerals, volcanoes, plate tectonics, earthquakes). Double-headed arrows between spheres. Sun at top labeled "Sun – energy driver of most Earth-system interactions"; core labeled "Earth's core – drives geosphere processes". Footer: "Closed system: energy enters & leaves; very little matter does."
- **`wildfire-spheres`** — A wildfire at center with four arrows/boxes showing how it interacts with each sphere: Atmosphere (lightning & wind start/spread fire; smoke, CO₂ released), Biosphere (plants = fuel; habitat lost; organisms killed; fire-adapted species regrow), Geosphere (soil organic layer burned, erosion & landslides after fire), Hydrosphere (drought dries fuels; ash & sediment wash into streams; less water absorbed by soil).

### Topic 2
- **`symbiosis-chart`** — Three side-by-side panels: MUTUALISM (+ / +) example "bee & flower", COMMENSALISM (+ / 0) "barnacle on whale", PARASITISM (+ / −) "tick on deer". Plus a 4th smaller panel PREDATION (+ / −) "mountain lion & deer — predator kills prey" and 5th COMPETITION (− / −). Each panel shows the two symbols for species 1 and species 2.
- **`competition`** — Two panels: INTRASPECIFIC (same species): several gulls crowding one nesting rock; INTERSPECIFIC (different species): a coyote and a bobcat both reaching for one rabbit. Simple shapes + labels.
- **`atlas-cascade`** — Atlas National Park trophic cascade, two columns. LEFT "Wolves removed": Wolves 0 → Deer & Coyotes ↑ (deer 15,000 vs normal 4,000–8,000; coyotes 600 vs 250–300) → Grass ↓ (400 vs 800–1,000 blades/m²) → Bees ↓ (2,000 vs 4,000–5,000 hives), Ravens ↓ (160 vs 220–270). RIGHT "Wolves reintroduced (5 yrs)": Wolves 97 → Deer 7,000, Coyotes 270 → Grass 850 → Bees 4,250, Ravens 245 → "All within normal range = equilibrium restored". Title: "Keystone species: wolves in Atlas National Park (Gizmo)".

### Topic 3
- **`redwood-web`** — Redwood forest food web (Big Basin). Nodes by trophic row (bottom to top):
  - Row 1 Producers: **Redwood sorrel**, **California poppy**
  - Row 2 Primary consumers: **California brush rabbit**, **Mule deer**
  - Row 3 Secondary consumers: **Gray fox**, **Bobcat**, **Coyote**
  - Row 4 Top: **Puma (mountain lion)**
  - Side (right): **Black bear (omnivore)**
  - Bottom strip: **Decomposers (fungi, bacteria)** with a dashed arrow from "all dead organisms" and a dashed arrow "nutrients → soil → producers".
  - ARROWS (from eaten → eater, solid): sorrel→rabbit, sorrel→deer, poppy→rabbit, poppy→deer, sorrel→black bear, rabbit→gray fox, rabbit→bobcat, rabbit→coyote, deer→coyote, deer→puma, deer→black bear, gray fox→puma, bobcat→puma.
  - Legend: "Arrow points from the organism eaten to the organism that eats it = direction of energy flow." Row labels on left: Producers (trophic level 1), Primary consumers (2), Secondary consumers (3), Tertiary consumers (4).
  - (Facts derivable: puma is secondary when eating deer and tertiary when eating gray fox/bobcat; black bear is primary when eating sorrel and secondary when eating deer; rabbit is eaten by 3 predators.)
- **`energy-pyramid`** — 4-tier pyramid: Producers (redwood sorrel) 3,500,000 kcal — 100%; Primary consumers (brush rabbit) 350,000 kcal — 10%; Secondary (gray fox) 35,000 kcal — 1%; Tertiary (puma) 3,500 kcal — 0.1%. Side arrows at each step: "≈90% used for metabolism (life processes) → lost as HEAT". Note: "Only ≈10% passes up each level."
- **`food-chain-arrows`** — Two versions of a chain stacked: (A) correct: Redwood sorrel → Mule deer → Puma, labeled "✔ Arrows follow energy (food → eater)"; (B) incorrect: Puma → Mule deer → Redwood sorrel labeled "✘ Arrows point to the food (wrong)".

### Topic 4
- **`kmodel`** — Recreate the class "Carrying Capacity Explanatory Model": y-axis "Population size", x-axis "Time / Number of generations". A curve: flat start at bottom-left labeled **A**, steep rise labeled **B**, bend near top labeled **C**, dashed horizontal line labeled **D** at its left end, then a wavy section oscillating slightly around the dashed line with peaks labeled **E** and **G** (above the line) and dips labeled **F** and **H** (below the line). NO word labels (letters only) in this version.
- **`kmodel-labeled`** — Same graph with word labels: A "slow start (lag)", B "exponential growth", C "growth slows (limiting factors)", D "carrying capacity (K)", E–H "cyclical/periodic fluctuation around K".
- **`overshoot`** — Recreate the worksheet graph: population rises steeply (exponential), shoots far above a dashed K line (big peak), falls sharply below the line, recovers, then smaller oscillations converge on the dashed line. Number markers in circles: **1** on the big peak, **2** on the steep rising part, **3** on the dashed line, **4** on the falling part after the peak, **5** on the rise after the lowest trough. Axes: "Population size" vs "Time". No word labels (numbers only).
- **`overshoot-labeled`** — Same, with word labels: 1 Overshoot, 2 Exponential growth, 3 Carrying capacity, 4 Decline (die-off), 5 Recovery.
- **`bean-line`** — LINE graph of class bean-simulation data: x "Time (years)" 0–8, y "Rabbit population" 0–80 with gridlines every 10; points (0,25) (1,33) (2,44) (3,64) (4,47) (5,73) (6,55) (7,50) (8,54); points marked and values labeled. Title "Bean 'rabbit' simulation: population per year". NO carrying capacity line.
- **`bean-line-k`** — Same plus a dashed line at ≈52 labeled "Estimated carrying capacity ≈ 50–55 rabbits" and a light band 47–55.
- **`jcurve-scurve`** — Two small graphs side by side: "Exponential (J-curve)" – unlimited resources, no K; "Logistic (S-curve)" – levels off at dashed K line, labeled. Axes "Population" vs "Time".
- **`lynx-hare`** — Stylized predator–prey cycle (illustrative, not real data): x "Year" 1850–1910 ticks every 10 years; y "Population (thousands)". Hare line (solid, blue) peaks at ~1855, 1865, 1875, 1885, 1895, 1905 (~120k); lynx line (dashed, orange) with lower peaks (~40k) each about 1–2 years AFTER each hare peak. Legend. Caption: "Stylized after Hudson's Bay Company fur records: ~10-year cycle; predator peaks lag prey peaks."

### Topic 5
- **`primary-succession`** — Horizontal timeline in 4 stages left→right (from class table): "Pioneer 0–150 yrs: lichen, crevice plants — bare granite/tiny rock bits", "Early intermediate 150–500 yrs: grasses & wildflowers, primary consumers — gravelly shallow soil", "Late intermediate 500–1,000 yrs: shrubs & small trees, secondary consumers — moderate soil", "Climax 1,000+ yrs: large trees, tertiary consumers & apex predators — deep rich soil". A soil layer beneath that thickens left→right; a starting icon "glacier-scraped bare rock (Yosemite)". Arrow under: "Light at ground decreases →; Biodiversity & soil depth increase →".
- **`secondary-succession`** — Timeline: "Mature forest" → "Disturbance (fire) — SOIL STAYS" → "0–1 yr: immediate aftermath — survivors: large trees, some animals; seed bank in soil" → "1–20 yrs: early recovery — grasses & wildflowers (pioneers)" → "20–150 yrs: mid-recovery — shrubs & small trees" → "150+ yrs: long-term recovery (climax)". Soil layer shown intact the whole way (contrast note: "Primary starts with NO soil").
- **`succession-compare`** — Venn-style comparison: Primary (no soil at start; bare rock/lava/glacier; pioneers = lichens & mosses; very slow — hundreds to 1,000+ yrs), Both (gradual change in community over time; pioneer → intermediate → climax; soil & biodiversity increase; triggered by disturbance/new land), Secondary (soil remains; after fire, flood, farming, logging; pioneers = grasses & wildflowers; faster — decades to ~150 yrs). Below, a small separate box: "Tertiary (Ms. Hero): soil NOT intact → humans intervene to restore (replanting, adding soil, erosion control)."
- **`fire-types`** — Forest cross-section with 3 fire types labeled: GROUND fire (smoldering in duff/roots below surface), SURFACE fire (low flames burning grass, needles, fallen branches, shrubs; tree crowns untouched), CROWN fire (flames in the tree tops, spreading tree-to-tree). Show "ladder fuels" (shrubs/low branches) carrying fire from surface to crown. Notes: Surface = usually low–moderate severity, clears fuel, big trees survive; Crown = high severity, kills most trees.
- **`fire-severity`** — 3-panel comparison: LOW severity (surface fire; most trees survive; litter partly burned; soil intact), MODERATE (mix; some trees killed; understory burned), HIGH (crown fire; most trees killed; soil organic layer burned off; erosion risk). Footer: "Severity = how much the fire changed the ecosystem (plants & soil). Intensity = how much heat/energy the fire released. Big Basin 2020: ≈77% high, 20% moderate, 2% low severity."
- **`frag-patterns`** — Six 10×10 grids (each 50 gray forest + 50 white meadow), labeled: **A Checkerboard** (alternating cells), **B Random** (pseudo-random 50 cells — use a fixed pattern), **C Stripes** (gray columns 1, 4, 5, 8, 9; white columns 2, 3, 6, 7, 10), **D Four Areas** (gray top-left 5×5 block and bottom-right 5×5 block; white the other two quadrants), **E Diamond** (one central diamond-shaped forest patch of 50 cells), **F Two Areas** (left 5 columns all gray, right 5 columns white). Legend: gray = forest (canopy intact), white = meadow (burned, now open). Caption: "Same amount of forest (50%), different patterns."
- **`frag-concept`** — Three panels left→right: "Continuous habitat" (one big forest block, with interior zone shaded darker and thin edge band), "Fragmented by road/development/fire" (same area cut into 4 pieces by a road and houses), "Isolated small patches" (small patches far apart; mostly edge, little interior). Labels: "edge", "interior". Bonus arrow showing a "wildlife corridor" connecting two patches.
- **`czu-timeline`** — Timeline 2020→ : "Aug 16, 2020: dry-lightning storm ignites fires (CZU Lightning Complex)", "Wind + steep slopes + dry fuels → rapid spread", ">97% of Big Basin Redwoods SP burned (CA's oldest state park, 1902)", "Sept 22, 2020: contained — 86,509 acres; ~1,490 structures destroyed", "Weeks–months later: redwoods resprout from trunk buds & burls; understory regrows; knobcone pine seeds released", "Ongoing: secondary succession; park reimagined; prescribed fire to reduce fuel". Include a small redwood cross-section icon with "thick bark (up to ~1 ft)".

### Topic 6
- **`fields-mice`** — Four square fields, each with 16 mice drawn as simple shapes (use 4 distinct shape/color species: black circle, white circle with outline, gray triangle, striped/hatched square). **Field W**: 16 of one species. **Field X**: 8 + 8 of two species. **Field Y**: 4 species with counts 13, 1, 1, 1. **Field Z**: 4 species 4, 4, 4, 4. Labels under each: "Field W", etc. (no answers on figure). Caption: "Each field has 16 mice."
- **`community-bars`** — Grouped/side-by-side horizontal bar charts of relative abundance for Community A (sp A 0.050, B 0.625, C 0.015, D 0.115, E 0.195; total 200) and Community B (sp A 0.10, E 0.35, F 0.08, G 0.18, H 0.29; total 100). Values labeled on bars. Title: "Same richness (5 species), different evenness".

### Topic 7
- **`levels-org`** — Nested levels: Organism (one mule deer) → Population (herd of mule deer) → Community (all species in Big Basin: deer, pumas, redwoods, fungi…) → Ecosystem (community + abiotic: water, sunlight, soil, temperature) → Biome (temperate coniferous forest) → Biosphere. Draw as nested rounded rectangles or a stair-step. Highlight "Ecosystem = BIOTIC + ABIOTIC interacting".
- **`biotic-abiotic`** — A simple forest-creek scene with numbered labels split into two color-coded lists: BIOTIC: redwood tree, banana slug, fungi on log, fallen log/dead leaves (once living), deer, bacteria in soil. ABIOTIC: sunlight, air temperature, creek water, rocks, soil minerals, wind. Footer: "Trap: dead leaves and logs are BIOTIC (once living)."

### Topic 8
- **`drymix`** — A blank labeled graph frame: Y-axis labeled "DRY: Dependent / Responding variable — Y-axis (what you MEASURE)", X-axis labeled "MIX: Manipulated / Independent variable — X-axis (what you CHANGE)". Example inset: "Bean simulation: x = Time (years), y = Rabbit population". Remind: "Title = DV vs. IV; label axes with units."
- **`line-vs-bar`** — Two mini graphs: LINE graph "Use for change over time / continuous data" (rabbit population by year); BAR graph "Use for comparing categories" (area burned by vegetation type: Conifer forest, Shrub, Grassland, Hardwood forest — illustrative values 9, 7, 4, 2 thousand hectares). Note under the bar: "✘ Bean data over time should NOT be a bar graph."
- **`fire-trend`** — ILLUSTRATIVE practice line graph (label it "Practice data — illustrative"): Title "Number of large wildfires (≥10,000 acres) per year, practice data". x "Year" 2000–2020 (every year). y "Number of large fires" 0–40. Values: 2000:8, 2001:10, 2002:9, 2003:13, 2004:7, 2005:9, 2006:15, 2007:24, 2008:21, 2009:12, 2010:6, 2011:9, 2012:16, 2013:14, 2014:18, 2015:22, 2016:19, 2017:30, 2018:28, 2019:11, 2020:37. Dashed trendline sloping upward (approx 8 → 28). Points marked.

### Topic 9
- **`cer-diagram`** — Three linked boxes: CLAIM ("One sentence that answers the question" — ex: "Reintroducing wolves restored equilibrium in Atlas National Park."), EVIDENCE ("Data, qualitative & quantitative, WITH UNITS" — ex: "After 5 years, deer fell from 15,000 to 7,000 and grass rose from 400 to 850 blades/m², both back in normal range."), REASONING ("Science concept that explains WHY the evidence supports the claim" — ex: "Wolves are a keystone predator; they limit deer, so grass recovers, which supports bees and other species — a trophic cascade."). Arrows Evidence→Claim and Reasoning linking them. Small "Ask: What? / How do you know? / Why does it matter (science)?"

---------------------------------------------------------------------
## 4. Topic quotas for drills (≈75) + mock test (25)
| Topic | # drills | Must include |
|---|---|---|
| 1 Earth Systems | 7 | each sphere ID'd in context; soil moisture/glaciers = hydrosphere trap; closed system; wildfire or volcano interaction; sun as driver |
| 2 Relationships | 10 | each symbiosis type in context; predator/prey; intra vs inter (gulls; lion/tiger; coyote/bobcat); keystone + Atlas NP (wolves not bees) |
| 3 Food webs & energy | 10 | autotroph/heterotroph; arrows; trophic level of puma/black bear in `redwood-web`; decomposers/scavengers/detritivores; metabolism → heat; 10% calc (3,500,000 kcal chain; 10,000 → 1,000) ; why fewer top predators |
| 4 Limiting & K | 11 | limiting factor def; bear-fish K=10 calc; DD vs DI (≥3 Qs); exponential; overshoot/decline/recovery with `overshoot`; `kmodel` letters; bean sim (line graph, K≈50); what raises vs lowers K; cyclical/periodic + lynx–hare lag |
| 5 Succession/frag/fire | 11 | primary vs secondary in context (Yosemite granite, burned forest, lava, abandoned farm); tertiary (teacher def); pioneer & climax; crown vs surface; severity vs intensity; disturbance; fragmentation patterns (`frag-patterns`: checkerboard most fragmented; same area, different patterns); CZU/redwood thick bark |
| 6 Biodiversity | 8 | richness vs evenness with `fields-mice`; Community A vs B vs C tables (equal richness, B more even, C richest); relative abundance calc; grass lawn uneven; why biodiversity → resilience |
| 7 Ecosystem | 5 | ecosystem def (biotic+abiotic); equilibrium; biotic vs abiotic trap (dead log) |
| 8 Graphs | 6 | DRY MIX; IV/DV in experiment; axis placement; line vs bar (bean sim); reading `fire-trend` (high/low/anomaly/trend); what you cannot conclude |
| 9 CER | 6 | best claim; best evidence (quantitative w/ units); best reasoning (science concept); weak vs strong; identify which part a sentence is |
