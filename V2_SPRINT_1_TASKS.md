# Year Ahead v2 - Sprint 1 Task Plan

## Sprint objective

Ship a credible v2 foundation by implementing:
- year-first hierarchy improvements,
- zoom scaffolding,
- transparent pressure model v1 inputs (controllability + anticipation),
- recovery declaration mechanics,
- trust disclosure surfaces.
- optional values declaration anchor.

This sprint prioritizes correctness and clarity over stylistic completeness.

---

## 1) Product/UX constraints for sprint

- Follow `V2_EXECUTION_CONTRACT.md` as hard source of truth.
- No prescriptive coaching copy.
- No clinical/diagnostic language (no burnout/anxiety/risk-score claims).
- No implied causality from inferred data; keep structural phrasing.
- No expansion beyond approved v2 model inputs.

---

## 2) Task breakdown by workstream

## A) Information hierarchy refactor (P0)

### Tasks
1. Move admin controls from primary header to profile/settings menu:
   - import/export
   - theme toggle
   - sign out
2. Keep top bar compact and year-canvas dominant.

### Likely files
- `index.html`
- `css/styles.css`
- `js/main.js`
- `js/auth/authUI.js` (if auth controls relocate)

### Acceptance
- Header no longer dominated by utility actions.
- Year canvas occupies clear visual majority at first load.

---

## A2) Values declaration anchor (P0)

### Tasks
1. Add optional values declaration prompt:
   - "What matters most this year?"
2. Ensure declaration is:
   - skippable,
   - editable,
   - not treated as a score.
3. Surface declaration in year context as a reflection anchor.

### Likely files
- `index.html`
- `js/store.js`
- `js/ui/modal.js` or `js/ui` prompt module
- `js/views/yearView.js`
- `js/storage/persistence.js`

### Acceptance
- User can add or skip a values declaration without blocking flow.
- Declaration appears as an orientation reference, not as a performance metric.

---

## B) Zoom scaffold (P0)

### Tasks
1. Introduce `zoomValue` and `zoomState` in app state.
2. Add top-bar zoom controls:
   - zoom out button
   - slider
   - zoom in button
   - state label
3. Map zoom ranges to:
   - `yearPulse`
   - `monthFocus`
   - `dayEdit`
4. Preserve selected date context through state transitions.

### Likely files
- `js/store.js`
- `js/views/viewController.js`
- `js/views/yearView.js`
- `js/views/monthView.js`
- `js/views/timelineView.js`
- `js/views/paragraphView.js`
- `index.html`
- `css/styles.css`

### Acceptance
- User can move across three zoom states without losing context.
- Current state is visually labeled.

---

## C) Pressure model v1 controls (P0)

### Tasks
1. Extend event model to include:
   - controllability (`high` | `low`)
   - anticipation flag (`true` | `false`)
2. Add UI controls in event edit modal for both properties.
3. Ensure values persist in save/load (local + cloud).
4. Reflect toggles in pressure calculation pipeline.
5. Expose visible pressure weighting components in context:
   - duration,
   - controllability,
   - anticipation.
6. Add pre-toggle prediction cue so user can anticipate pressure change direction.

### Likely files
- `js/events/eventManager.js`
- `js/ui/modal.js`
- `js/storage/persistence.js`
- `js/services/supabaseService.js` (if schema assumptions require guard logic)
- `js/views/*` rendering modules for pressure tinting

### Acceptance
- Modifying controllability/anticipation changes rendered pressure in expected direction.
- Properties survive refresh, year switch, and import/export.
- User can predict pressure change before toggling with reasonable confidence.
- Weighting components are visible where model adjustments occur.

---

## D) Recovery declaration mechanics (P0)

### Tasks
1. Add event-level restorative override:
   - restorative
   - draining
   - neutral/default
2. Seed default restorative inference by category:
   - Rest, Vacation, Personal, Health
3. Ensure override wins over inferred default.
4. Include explicit recovery guardrail copy:
   - "Open space doesn't automatically mean recovery."

### Likely files
- `js/ui/modal.js`
- `js/store.js`
- `js/storage/persistence.js`
- `js/views/*` (for derived recovery signals)

### Acceptance
- Recovery signal is no longer equivalent to empty schedule.
- User override explicitly changes interpretation.
- Guardrail line is visible in recovery-related UI/explanation.

---

## E) Trust architecture surfaces (P0)

### Tasks
1. Add "How pressure is estimated" disclosure with progressive disclosure in context:
   - inline link, tooltip, or expandable panel near insight and controls.
2. Include:
   - inferred vs user-entered distinction
   - adjustment instructions
   - model caveat language
3. Ensure disclosure is accessible and discoverable (not buried in settings/docs).

### Likely files
- `index.html`
- `css/styles.css`
- `js/main.js` (for toggling/placement if needed)

### Acceptance
- Users can locate and paraphrase model logic without guesswork.

---

## F) Seasonal markers (P1)

### Tasks
1. Add subtle quarter transition markers in year view.
2. Optionally add equinox/solstice ticks.
3. Keep visual weight low; no interpretive copy.
4. Use astronomical-only markers with culturally neutral wording.

### Likely files
- `js/views/calendarRenderer.js`
- `js/views/yearView.js`
- `css/styles.css`

### Acceptance
- Seasonal markers visible but non-dominant.

---

## 3) QA protocol (from board guidance)

## A) Pattern recognition test

Procedure:
- Show Year Pulse for 15 seconds.
- Ask:
  - where pressure is highest,
  - where recovery appears low.

Pass:
- user answers quickly and confidently.

## B) Model trust interview

Ask:
- does estimate feel accurate?
- what feels wrong?
- what would improve trust?
- "How accurately does this reflect your year?" (1-7)

Failure signals:
- "feels arbitrary,"
- "feels magical,"
- confusion about editable inputs.

Pass threshold:
- mean trust accuracy score >= 5.

## C) Toggle comprehension test

Procedure:
- user toggles controllability and anticipation.
- ask predicted change before toggle.
- ask if resulting visual change matches prediction.

Pass:
- user can explain why pressure changed.
- user prediction and observed direction are aligned.

## D) Language and boundary compliance test

Check all insight/disclosure copy for:
- non-moralizing, agency-preserving language,
- no implied causality from inferred data,
- no clinical/diagnostic wording (burnout/anxiety/risk score).

Pass:
- no violating copy remains in sprint scope surfaces.

---

## 4) Definition of done (Sprint 1)

Sprint is done only when:

1. Header hierarchy is fixed (year-first visual priority).
2. Optional values declaration exists and remains non-scoring.
3. Zoom scaffold is operational.
4. Controllability + anticipation are editable and persistent.
5. Pressure weighting visibility and pre-toggle predictability are implemented.
6. Recovery declaration exists with override logic plus explicit guardrail copy.
7. Trust disclosure is in-context via progressive disclosure and understandable.
8. Seasonal markers remain astronomical and culturally neutral.
9. QA protocol yields no critical comprehension failures and trust score target >= 5.

---

## 5) Out-of-scope reminders

Do not include in Sprint 1:
- coaching prompt engines
- complex narrative summaries
- behavioral scoring systems
- advanced physiological integrations

---

## 6) Suggested implementation order

1. Header hierarchy
2. Zoom scaffold
3. Event schema extension
4. Modal controls for controllability/anticipation/recovery
5. Values declaration anchor + persistence
6. Pressure weighting visibility + prediction cue
7. Persistence updates
8. Pressure/recovery rendering updates
9. Trust disclosure (progressive in-context)
10. Copy compliance pass (language and boundary rules)
11. QA protocol run + fixes

This order minimizes rework and keeps product intent visible early.

