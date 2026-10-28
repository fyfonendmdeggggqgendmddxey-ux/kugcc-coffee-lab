# Coffee coach references — first implementation

This collection supports source-attributed recipe selection and original-condition
comparison. It is not a learned extraction or taste prediction model.

## Data and review

- `raw/`: the reviewed snapshots of 24 barista recipes, 15 bean-condition profiles
  and the per-record decision catalog (reviewed 2026-10-29).
- `references.json`: runtime index built with
  `python3 scripts/build-coffee-references.py`. It retains unknowns, original units,
  author/publisher attribution, source URLs, review holds and time semantics.
- These are 39 reference records, not 39 independent beans or extraction trials.
  Templates and multiple recipes for one lot remain separate reference records.
- Source access dates document source review, not physical brewing or calibration.
  See `rights_note` in each raw collection for its reuse context. Sources are linked
  in the app; no permission for unrelated source material is implied.

## Selection

`utils/coffee-references.ts` performs deterministic retrieval, not probability
estimation. Brewer families must match; an unknown device is never assumed V60.
The ±25% dose window is a search policy, not a scientifically established threshold.
Roaster-scoped templates require that roaster and the stated process/roast scope.
Density-specific profiles are held because the existing Bean schema does not
measure density. Lot profiles require the stated lot and roaster; variety/origin
alone cannot establish lot identity. Unknowns are shown as unknowns.

Cross-roaster and incompatible conditions remain comparison material, without
automatic process-effect coefficients. Competition recipes do not become everyday
starting candidates. Decaf is not covered by these initial candidate adapters.

## Timer adapters

Source review never grants automatic timer import. Five separately enumerated,
versioned adapters require user inspection and a button press:

| Reference | Handling |
| --- | --- |
| Kurasu V60 12g | Three timed pour/wait intervals; unknown pour durations stay unknown. Final stir is an instruction after the last pour. |
| DAK default | Published flow rates convert to pour duration; separate zero-water waits. |
| DAK natural / fermented | Same conversion, preserving 16.5g dose and 250g contact water. |
| 20grams washed | Published 10s pours, including circle/center instruction, plus separate waits. |
| 20grams natural | Published 10s pours, preserving low-turbulence circle/center instruction, plus waits. |

Original dose and contact water are preserved; no scaling. A current temperature
within the source range is retained; otherwise its lower bound is selected and
disclosed. Range-target recipes notify at the lower bound, explicitly labelled;
this is a timer convention, not predicted drawdown. Current grinder settings remain
unchanged and explicitly uncalibrated to the original. Applying makes a user copy
with source/adaptation metadata and does not replace any saved original recipe.

## Concentration and measurements

`utils/brew-simulation.ts` provides a separate mass-balance scenario:

```
assumed beverage mass ≈ actual planned contact water − retention × dose
scenario TDS[%] = assumed EY[%] × dose / assumed beverage mass
measured EY[%] = measured TDS[%] × measured beverage mass / actual dose
```

Initial EY 19% and retention 2g/g are editable illustrative assumptions, not learned
defaults. No empirical precision or prediction interval is claimed. Evaporation,
device residual water and bypass are excluded from the scenario; measurements
must pair the same liquid state, including all bypass if measured after dilution.
Changing bean/grind/temperature does not secretly adjust assumed EY. Existing
heuristic scores remain separate and are marked uncalibrated.

TDS, beverage mass and elapsed time are optional under a collapsed detail section.
Empty fields do not become zero. Measured EY needs TDS, beverage mass and dose.
Saved logs retain the actual recipe and bean snapshot; source metadata survives
existing JSON save/export/import without a new storage system. Scenario settings
live separately under `kugcc_simulation_v1`; the existing backup does not export
these UI preferences.

## Remaining work

- Dryad sensory aggregates are not mapped onto arbitrary pour-over beans or radar
  intensity scores. Their controlled batch-brewer scope does not validate that map.
- Learned bean/grind → EY/strength/taste models, uncertainty calibration, local
  adjustment from history and demonstrated trial reduction require suitable
  independent extraction measurements and held-out validation.
- More source-confirmed lot, processing, paper, device and pour semantics are
  needed before expanding timer adapters.

Run `npm test`, `npx tsc --noEmit` and `npm run build` for implementation checks.
