# Year Ahead v2 Board Brief (Revised)

## Purpose of this document

This revision incorporates board feedback and clarifies the v2 product scope, language, and implementation strategy.

It is designed to keep product ambition high while preventing philosophical and UX overreach in v2.

---

## 1) Primary product identity (chosen)

### Primary role
**Values alignment mirror**

Year Ahead’s primary job is helping users see whether their time allocation matches how they want to live.

### Secondary roles
- Strategic planning layer
- Burnout prevention signal

### Deferred identity (not primary in v2)
- Existential awareness/coaching system

Rationale: this keeps v2 focused, testable, and credible.

---

## 2) Positioning language update

Board concern: "feel your year" is evocative but vague.

### Proposed external framing
- **See the shape of your year.**
- **Design the rhythm of your year.**

### Proposed product one-liner
Year Ahead helps you see whether how you spend your time matches how you want to live.

---

## 3) Product thesis (unchanged core, sharpened)

Mainstream calendars answer:
- "What is happening Tuesday at 3 PM?"

Year Ahead should answer:
- "What does this season of my life look like?"
- "Where is pressure accumulating?"
- "Where is restoration absent?"
- "Does my year reflect my priorities?"

This is pattern interpretation, not schedule logistics.

---

## 4) First-principles UX model

1. **Year-first hierarchy**  
   The year canvas is the hero.

2. **Zoom continuity**  
   Far/mid/near transitions should feel continuous, not modal resets.

3. **Signal over decoration**  
   Pattern detection is the product; decoration is optional.

4. **Observational tone over prescription**  
   Surface patterns and reflection prompts, avoid moral scoring.

5. **Trust architecture by design**  
   Be explicit about what is inferred vs entered vs adjustable.

---

## 5) Board-validated UX priorities (must keep)

- Year-first hierarchy
- Zoom continuum
- Signal-over-decoration visual pass
- Ruthless 10-second interpretability test

---

## 6) Corrections from board feedback (must change)

### 6.1 Load model should not be naive
Do not treat load as purely event count/duration.

v2 model should be hybrid:
- inferred baseline (from density, span, category),
- user-adjustable weighting,
- lightweight calibration prompt ("Does this month feel heavy?")

### 6.2 Recovery is not emptiness
Low event density is not equivalent to recovery.

v2 should support explicit restorative markers:
- restorative category/tag
- dedicated recovery block type
- optional manual monthly recovery rating

### 6.3 Category balance language should preserve agency
Avoid accusatory statements like "you are under-prioritizing X."

Use:
- "This quarter skews toward work. Does that match your intention?"

### 6.4 Interpretation scope guardrail
v2 should:
- reveal patterns,
- suggest reflection,
- avoid life coaching prescriptions.

---

## 7) Additions accepted for roadmap

### 7.1 Seasonal framing (lightweight v2)
- quarter transitions
- optional solstice/equinox markers

### 7.2 Chapter markers
Allow users to label periods:
- Sprint
- Transition
- Recovery
- Launch
- Family stretch

### 7.3 Anticipation gradient (v2.5 candidate)
Stress often ramps before events; support pre-event halo/ramp visualization.

### 7.4 Peak-end awareness (v2.5 candidate)
End-of-quarter and end-of-year summaries.

### 7.5 Physiological realism (future)
Explicitly deferred from v2, but acknowledged on roadmap.

---

## 8) Trust architecture (new required layer)

Every insight surface should provide:

1. **How it was calculated**
2. **What was inferred**
3. **What was user-entered**
4. **How to adjust it**
5. **Confidence caveat**

Without this, trust will collapse even if visuals are strong.

---

## 9) v2 feature envelope

### Absolute must
- Year hierarchy refactor
- Zoom continuity scaffold
- Visual density + seam cleanup
- One transparent pressure layer
- Gentle insight strip with observational language

### Explicitly defer
- heavy narrative coaching
- deep interpretation prompts
- advanced seasonal/physiological integrations
- complex category taxonomies

---

## 10) Success criteria (v2)

Within 10 seconds, user can answer:
- where pressure is likely highest,
- where restoration appears low,
- whether current distribution appears intentional.

And user trusts the model enough to understand:
- "how this was inferred"
- "how to correct it"

---

## 11) Phase 1 engineering plan (revised and concrete)

### 11.1 Information hierarchy refactor
Goal:
- move import/export/theme/sign-out into profile/settings area.

Likely touch points:
- `index.html`
- `css/styles.css`
- `js/main.js`

---

### 11.2 Zoom scaffold (discrete anchor states first)
Goal:
- implement Year Pulse / Month Focus / Day-Edit state continuity.

Likely touch points:
- `js/store.js` (`zoomState`, `zoomValue`)
- `js/views/viewController.js`
- `js/views/yearView.js`
- `js/views/monthView.js`
- `js/views/timelineView.js`
- `js/views/paragraphView.js`

---

### 11.3 Continuity and density pass
Goal:
- improve year readability and remove seam artifacts.

Likely touch points:
- `css/styles.css`
- `js/views/calendarRenderer.js`
- `js/views/paragraphView.js`

---

### 11.4 Category key -> legend + insight strip
Goal:
- move from configuration UI to interpretive UI.

Likely touch points:
- `js/ui/categoryKey.js` (or replacement module)
- `index.html`
- `css/styles.css`
- new summary/insight UI module

---

### 11.5 Transparent Pressure Layer v1
Goal:
- ship one trustworthy, adjustable pattern layer.

Requirements:
- baseline inferred score
- user weight adjustments
- "how calculated" disclosure

Likely touch points:
- `js/store.js` (weights + computed scores)
- view renderers (`js/views/*`)
- settings UI for calibration

---

## 12) Risks to watch

- becoming "productivity app with nicer colors"
- slipping into moralizing guidance
- over-interpreting sparse data
- visual density becoming illegible
- model opacity reducing trust

---

## 13) Follow-up questions for board (round 2)

1. Does "values alignment mirror" feel like the right primary identity?
2. Which two user-adjustable load inputs are highest value in v2?  
   (e.g., anticipation, controllability, emotional valence)
3. What is the minimum credible definition of "restorative" behavior?
4. Should seasonal markers be on by default or opt-in?
5. What wording best preserves agency in insight copy?
6. What confidence language is understandable without sounding defensive?

---

## 14) Recommendation

Proceed with a focused v2:
- make the year legible and continuous,
- ship one transparent pressure layer,
- use observational insight language,
- defer deep coaching until trust and usage prove readiness.

This path keeps the product ambitious while protecting its credibility.

