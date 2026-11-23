# Facts to double-check

Please spot-check these against a textbook or the CCI materials. Everything about the **exam format and
blueprint** was read directly from CCI's own pages (see `exam-outline.md`). The clinical content was written
from standard references and cites them, **but those reference documents were not opened and re-read line by line
while this bank was being built**, so treat the items below as the ones most worth checking.

## Assumptions made by the app (not CCI facts)
| Item | What the app does | Why it needs care |
|---|---|---|
| Pass line | Practice exam "likely pass" at ≥ 70% correct | CCI uses a scaled score (650 of 900) and does not publish a percent equivalent. |
| Medication weight | Medication content capped at 40% ÷ 11 tasks ≈ 3.6% | CCI lists medications as 1 of 11 tasks in Rhythm Analysis but gives no separate percentage. |
| Exam date | Defaults to 2027-01-15 | You said "mid-January 2027"; set your real date in Settings. |
| Readiness meter | Blends weighted recent accuracy with practice-exam scores | A study estimate, not a prediction from CCI data. |

## Values where sources differ or the number depends on the device or lab
- **QTc upper limit.** The app uses AHA 2009 (≥ 450 ms men, ≥ 460 ms women is prolonged; > 500 ms is high risk). Some textbooks use 440 ms.
- **Atrial fibrillation atrial rate (350–600/min) and flutter rate (250–350/min).** Ranges vary slightly by textbook.
- **Cycle ergometer peak VO2.** The app says it is "about 10–20% lower" than on a treadmill. Published ranges run from about 5% to 25%.
- **Heart-rate recovery.** Abnormal is ≤ 12 bpm at 1 minute with an upright cool-down. The cut-off is different with immediate supine recovery (about ≤ 18 bpm).
- **Low-level post-MI test endpoints.** About 5–6 METs, about 120 bpm or 70% of predicted (from the ACC/AHA 2002 guideline). Check your lab's protocol.
- **Dobutamine staging.** 3-minute stages, from about 5–10 up to 40–50 mcg/kg/min, with atropine if needed (ASNC). Protocols vary.
- **Holter "significant pause" ≥ 3 s.** Report thresholds vary by lab.
- **Device durations.** Event/loop recorder up to about 30 days, patch about 14 days, implantable loop recorder up to about 3 years. These depend on the device.
- **"Avoid a hot shower right after an exercise test."** This is common lab advice; no specific guideline wording was confirmed.
- **Mason-Likar (torso) limb placement can shift the axis rightward and change inferior-lead amplitudes.** The AHA notes that torso placement changes the tracing; the size and direction of the change vary.
- **Mixing electrode brands causes baseline instability.** This is a practical teaching point; confirm it with your program's textbook.
- **RCA supplies the SA node in about 60% of people and the AV node in about 90%.** These are standard textbook figures, but percentages vary between sources.
- **CDC PPE removal order.** The app teaches CDC's "example 1" (gloves → goggles → gown → mask). CDC also shows an alternative where the gown and gloves come off together.

## Added in the November 2026 update (anatomy, communication, traps, planner)
- **Atrial kick ≈ 20–30% of ventricular filling.** Textbooks give ranges from about 15% to 30%.
- **Normal LVEF ≈ 50–70%.** Labs and societies use slightly different cut-offs (some say ≥ 55%).
- **"About two-thirds of the heart's mass lies left of the midline."** Standard anatomy-text wording (Hole's); not re-read line by line.
- **Caffeine hold before vasodilator stress "at least 12 hours".** ASNC wording; some labs require 24 hours.
- **LA–LL reversal clue "P wave taller in lead I than lead II".** A published teaching clue, but not every case shows it.
- **Wellens pattern and "ST elevation in aVR with diffuse ST depression → left main/multivessel disease".** Correct as warning patterns; how they are described varies between sources.
- **Holter electrodes "over bone".** Standard Holter technique in technician texts; manufacturer instructions take precedence.
- **Qualified interpreters, not minors (Section 1557).** The rule allows exceptions in emergencies; facility policy governs the details.
- **AIDET** is a widely used communication framework (Studer Group), not a regulatory requirement.
- **Exam-day checklist.** The ID rules and timing come from CCI's CCT page (re-read 2026-11-23). "Arrive early" and "store your phone and bag" are general Pearson VUE practice, so check your confirmation email for exact rules.
- **Exam pacing checkpoints** (Q33 ≈ 28 min, Q65 ≈ 55 min, Q98 ≈ 83 min) are simple arithmetic from 110 minutes ÷ 130 questions, not CCI guidance.
- **Plan structure** (3 learn weeks, 3 mixed weeks, 1 exam week, 1 light week) follows your request, not a CCI recommendation.

## Generated ECG images
- The generator (`js/ecg.js`) is a **teaching model**, not a physiological simulator. Rates, PR, QRS, QT, regularity, P-wave relationships, ST levels and voltage criteria are set explicitly and **machine-checked** (`tools/criteria.mjs`). Fine morphology (exact wave shapes in every lead, R-wave progression, T-wave shapes) is only approximately realistic.
- The posterior-MI, septal-MI and LA–LL reversal tracings are subtle by nature; read them together with their explanations.

## Real ECG images
- Diagnoses come from each uploader's description on Wikimedia Commons and were checked visually. They have **not** been confirmed by a cardiologist.
- Licenses were read from Commons machine-readable metadata on 2026-11-23 (see `ATTRIBUTION.md`).

## Automated self-review: what is left
After the November 2026 pass, 235 multiple-choice items got new, length-matched wrong answers. The 'answer is much longer than the distractors' warning dropped from 268 items to 17. In the remaining 17 the correct answer is legitimately detailed, and the wrong answers are still plausible.

_Earlier note:_
`tools/validate.mjs` still flags about 150 items where the correct option is noticeably longer than the distractors (a possible test-taking cue). The facts in these items are correct. Making the distractors similar in length would be a good next editing pass.
