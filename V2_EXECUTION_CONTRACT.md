# Year Ahead v2 Execution Contract

## Purpose

This document converts board-approved strategy into implementation constraints.

It is the source of truth for:
- product identity,
- model scope,
- UX language rules,
- trust architecture,
- release acceptance criteria.

If a feature conflicts with this contract, it does not ship in v2.

---

## 1) Product identity (locked)

### Primary identity
**Values alignment mirror**

Year Ahead reflects lived time back to users relative to what they say matters.

### Optional values declaration (v2 required capability)
Users can optionally declare: **"What matters most this year?"**

This declaration is user-authored, editable, and can be left blank. It is a reflection anchor, not a scoring input.

### Secondary identities
- strategic planning layer
- pressure pattern signal

### Explicitly not primary in v2
- life coach
- behavioral scoring system
- existential interpretation engine

---

## 2) Non-negotiable product principles

1. **Year-first hierarchy**  
   The year canvas is visually primary.

2. **Zoom continuity**  
   UX transitions across scale, not disconnected "mode switches."

3. **Signal over decoration**  
   Pattern readability beats stylistic flourish.

4. **Observational tone**  
   Surface patterns, do not prescribe behavior.

5. **Trust architecture required**  
   Inference logic must be visible and adjustable.

---

## 3) v2 pressure model scope (locked)

v2 pressure estimate includes:
- baseline from event density/duration/category,
- **controllability** modifier (user-set),
- **anticipation stress** modifier (user-set).

### Visible weighting contract (required)
Pressure weighting must be visible in-product and expressed structurally:
- duration contribution,
- controllability contribution,
- anticipation contribution.

Users must be able to inspect these weight components where they make adjustments.

### User-adjustable inputs (required)

1. **Controllability**
   - high control
   - low control

2. **Anticipation stress**
   - on/off flag: "this weighs on me beforehand"
   - visible pre-event ramp-up effect

### Deferred from v2
- emotional valence
- social complexity
- travel disruption
- physiological integrations

---

## 4) Recovery model scope (locked)

Recovery must be **declared, not assumed**.

### v2 requirement
- inferred defaults by category (Rest, Vacation, Personal, Health)
- user override at event level:
  - "Restorative for me"
  - "Draining for me"

### v2 anti-pattern
- equating empty calendar space with recovery
- "Open space doesn't automatically mean recovery."

---

## 5) Insight language contract

### Allowed pattern
Observational reflection question:
- "This quarter skews toward work. Does that reflect your intention?"

### Banned language
- "you should..."
- "fix this..."
- "you are under-prioritizing..."
- "this will burn you out..."
- "optimize/hack/maximize..."

### Copy rule
- describe
- contextualize
- invite reflection
- preserve agency

### Inference phrasing rule (required)
- Do not imply causality from inferred data.
- Use structural phrasing (for example: "This period shows concentrated load") instead of causal claims.

### Interpretive boundary (required)
No clinical or diagnostic language in v2 surfaces, including:
- burnout claims,
- anxiety claims,
- risk-score framing.

---

## 6) Trust architecture contract

Every pressure/recovery insight surface must include:

1. How pressure is estimated.
2. Which inputs are inferred.
3. Which inputs are user-entered.
4. How users can adjust modifiers.
5. Model limitation statement.

### Delivery pattern (required)
Trust architecture must be progressively disclosed in context:
- inline link, tooltip, or expandable panel near the relevant insight/control,
- not hidden only in settings or documentation.

### Baseline disclosure copy (v2)
- "Pressure is an estimate based on event density, duration, controllability, and anticipation."
- "You can adjust how events feel."
- "This model can't see everything. Your judgment matters most."

---

## 7) Seasonal framing contract

### v2 requirement
- subtle quarter transition markers on by default
- optional equinox/solstice ticks
- astronomical markers only; culturally neutral framing

### v2 boundary
- no interpretive seasonal coaching copy

---

## 8) UX acceptance criteria (release gates)

### Gate A: 10-second interpretability
User can identify quickly:
- high pressure periods,
- recovery gaps,
- major skew in year distribution.

### Gate B: Toggle causality clarity
Before changing controllability/anticipation, users can predict direction and rough magnitude of pressure change; after toggling, visuals update in line with that prediction.

### Gate C: Trust comprehension
Users can answer:
- "What is inferred?"
- "What can I edit?"
- "What are model limits?"

### Gate D: Language compliance
No moralizing or prescriptive copy in shipped insight surfaces.

### Gate E: Trust accuracy KPI
Prompt in testing and early release: **"How accurately does this reflect your year?"** (1-7 scale).

Release target: average score >= 5.

---

## 9) Scope boundaries (what does not ship in v2)

- deep coaching flow trees
- behavioral scorecards
- advanced narrative prompting
- complex psychometric inference
- physiological data integrations

---

## 10) Delivery standard

Before v2 sign-off:
- all acceptance gates pass,
- trust copy exists in-product,
- model toggles are testable and understandable,
- pressure weighting is visible (duration/control/anticipation),
- year-first hierarchy is visually obvious at first load.

If these conditions are unmet, v2 release is blocked.

