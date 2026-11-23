# CCT Study

A free, offline, mobile-friendly study app for the **Cardiovascular Credentialing International (CCI) Certified Cardiographic Technician (CCT)** exam.

> **Study aid only. Not an official CCI product.** It is not affiliated with, sponsored or endorsed by CCI.
> Always confirm exam details at [cci-online.org](https://cci-online.org/credentials/certified-cardiographic-technician/).

**Open it:** https://seanbarrameda501.github.io/CCT-Study/ (once GitHub Pages is turned on; see below).

## What's inside

| | |
|---|---|
| **1,360 questions** | 1,287 core questions in the official CCI proportions (Pre-Procedural 10.9%, Resting ECG 13.8%, 12-Lead Analysis 21.8%, Stress 9.9%, Ambulatory 4.0%, Rhythm Analysis 39.6%), plus a **73-question anatomy & blood-flow bonus set** (see below). Every question has an explanation and a source. |
| **Item types like the real exam** | Multiple choice, select-all-that-apply, ordering, and hot spot (tap the PVC, the dropped P wave, or the lead with ST elevation). |
| **466 ECG images** | 16 **REAL** licensed recordings and 450 **GENERATED** tracings (387 rhythm strips and 63 full 12-leads), each labeled. |
| **673 flashcards, 58 mini-lessons, 223 glossary terms** | Lessons appear after every wrong answer and in the Learn tab. |
| **A plan that tells you what to do** | Today's plan with self-checking tasks, a day-by-day calendar to exam day, catch-up and re-plan, rest days, reminders. |

### Extra weight on anatomy and blood flow
A recent test-taker reported that cardiac anatomy and blood flow were heavily tested. CCI does not list A&P as its own domain, so the core bank keeps CCI's percentages, and a bonus set is added **on top**:
73 extra questions, 50 extra flashcards and 6 extra lessons on chambers, valves, great vessels, coronary circulation, the conduction system, the cardiac cycle and the full path of blood.
A&P now makes up **104 of 1,360 questions (7.6%)**, compared with 31 (about 2%) in the CCI-proportioned core. The practice exam still draws only from the core bank in CCI proportions.

Where the official figures came from: [`docs/exam-outline.md`](docs/exam-outline.md).
Facts worth double-checking: [`docs/unverified-facts.md`](docs/unverified-facts.md).
Image credits: [`ATTRIBUTION.md`](ATTRIBUTION.md).

## Turning on GitHub Pages (one time)

1. On GitHub, open a pull request from the branch `claude/relaxed-heisenberg-ebxj52` into `main` and merge it.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Set **Branch** to `main` and the folder to **/ (root)**, then click **Save**.
5. Wait 1–2 minutes and refresh the Pages screen. It shows the live link: **https://seanbarrameda501.github.io/CCT-Study/**

To try it before merging, pick the `claude/relaxed-heisenberg-ebxj52` branch in step 4 instead.
On a free GitHub account the repository must be **public** for Pages to work.
No build step is needed: the repository root is the site (`.nojekyll` is included).

## Installing it on your phone

1. Open the link in **Safari** on iPhone or **Chrome** on Android.
2. **iPhone:** tap **Share**, then **Add to Home Screen**. **Android:** tap the **⋮** menu, then **Install app** (or **Add to Home screen**).
3. Open the app once while online and leave it open for about a minute. It downloads all questions and images (about 12 MB) for offline use. You can check this under **Progress → App settings → Offline**.

After that it works with no internet connection.

## Using it

**First launch.** A short walkthrough explains the app and asks for your name, exam date, start date and hours per day. It then builds a day-by-day plan through exam day. You can replay it any time with the **?** button.

**Two people, one phone.** Tap the 👤 chip to add a profile. Each profile has its own progress and its own plan. On separate phones, just share the link.

**The five tabs**
- **📅 Today** opens with **Today's plan**. Overdue tasks come first, then today's tasks in order, each with a checkbox. Tap a task to start it; it checks itself off when you finish. The next step is marked **Start here**. A progress bar shows the current week. When everything is done you'll see **Done for today**, which means you can stop. Below that are tomorrow's tasks, the readiness meter with an exam countdown, and accuracy for each content area.
- **📘 Learn:** lessons, anatomy & blood flow, patient care & communication, lead placement, exam traps, memory aids, medications, glossary, printable cheat sheets, ECG gallery, and the study guide.
- **✏️ Practice:** quick quiz, topic drill, interleaved practice, smart review, the 130-question timed exam with a pacing coach, a 30-question pacing drill, rhythm trainer, calculations, patient scenarios, exam-traps quiz, rapid fire, search and bookmarks. Each mode says when to use it.
- **🔁 Review:** what's due today (spaced repetition at 1, 3, 7 and 14 days), flashcards, weak spots, final-week mode, the end-of-day recap, and glossary drill.
- **📊 Progress:** readiness, the study calendar, practice exam history, plan settings and reminder, app settings (dark mode, text size, daily goal, confidence buttons, export/import), profiles and Help.

**The plan.** Weeks 1–3 cover each content area, starting with anatomy. Weeks 4–6 are daily mixed quizzes and spaced review, with a pacing drill each week. Week 7 has full timed practice exams. The last week is light review of weak spots, plus the exam-day checklist.
- **Calendar.** Swipe or tap to move between days, and start a future day's tasks early. They count toward that day. The month view marks each day as done, partly done, missed, upcoming or rest.
- **Falling behind.** If you fall behind, Today shows a **Behind schedule** banner with two options. **Catch up now** lists the missed tasks, with the important ones starred. **Re-plan** spreads the remaining lessons evenly over the days left. Missed work is never deleted silently.
- **Weak topics.** If a topic drops below 60% (after 8 or more attempts), the plan adds extra review for it over the next two study days.
- **Your schedule.** Mark rest days or change hours per day in **Plan settings**, and the plan recalculates from today.

**Reminders.** Set a time in Plan settings. If you allow notifications, the app sends one while it is open or in the background. For a reminder that always works, tap **Add daily reminder to my calendar** to download a repeating calendar event. Today also shows a banner if you open the app after your reminder time.

**Practice exam.** 130 questions are drawn in CCI proportions, and 20 are treated as unscored pretest items. The clock defaults to 1 h 50 min, the real question time; 2 h is optional. A pacing coach shows whether you are on pace or behind. You can flag questions, and before you submit, a review screen lists flagged and unanswered items. At the end you get a pass estimate (≥ 70% correct) and a breakdown by area. CCI's real cut score is a scaled 650/900, so the estimate is only a guide.

### Sharing with a study partner
Send them the link (Progress → Share the app link). Each phone keeps its own progress. To move progress between phones, use **Export** on one and **Import** on the other.

## Adding or editing questions

Content is written in small JavaScript files and then compiled into the JSON files the app reads.

1. Edit or add items in `tools/content/` (for example `a-preprocedural.mjs` … `f-rhythm.mjs`, or `extra.mjs`):
   ```js
   M('Subtopic', 2, 'Question stem?', 'Correct answer', ['Wrong 1', 'Wrong 2', 'Wrong 3'],
     'Two to four sentences: why the answer is right and why the others are wrong.', SRC.BOOTH),
   S('Subtopic', 2, 'Which are … ? (Select two.)', ['Right 1', 'Right 2'], ['Wrong 1', 'Wrong 2', 'Wrong 3'], 'Explanation', SRC.CCI),
   O('Subtopic', 2, 'Put these in order.', ['First', 'Second', 'Third'], 'Explanation', SRC.CCI),
   ```
   Always write the correct answer first; the build shuffles the options. `SRC` holds the source citations (see `tools/content/helpers.mjs`). Add `{ tags: ['scenario'] }` for patient cases or `{ tags: ['medication'] }` for drug items.
2. Rebuild and validate (requires Node.js 18 or newer):
   ```bash
   ./tools/build-all.sh
   ```
   This regenerates the ECG images, `data/*.json` and `sw.js`. It then runs `tools/validate.mjs`, which checks that every multiple-choice item has four options and exactly one key, that the area percentages match CCI within one percentage point, that medication content stays at or under 3.6%, and that there are no duplicate questions.
3. Commit and push. GitHub Pages updates automatically, and phones pick up the new version the next time they open the app while online.

Flashcards live in `tools/content/flashcards.mjs` (format `area|topic|front|back`), lessons in `tools/content/lessons.mjs`, and glossary terms in `tools/content/glossary.mjs`.
Other content files:
- `anatomy.mjs`: the anatomy bonus questions, lessons and cards. Items tagged `anatomy-bonus` don't count toward the area percentages.
- `communication.mjs`: patient care and communication.
- `traps-q.mjs` and `traps-list.mjs`: exam-trap questions and the mistakes list.
- `distractor-fixes*.mjs`: wrong answers rewritten during the self-review so they're about as long as the correct answer.

If the validator warns that "the correct answer is much longer than distractors", make the wrong answers just as specific.

### Running it on a computer
The app must be served over http (not opened as a file):
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000.

## How the ECG images are made
- **Real** (`images/real/`): recordings from Wikimedia Commons. Only CC0, public-domain, CC BY and CC BY-SA files were used, with the license read from Commons metadata. The author, license and source link are shown under each image and in `ATTRIBUTION.md`.
- **Generated** (`images/generated/`): drawn by `js/ecg.js`, which models each wave as a 3-D cardiac vector projected onto every lead (so Einthoven's law holds). Strips include baseline wander, noise and beat-to-beat variation, drawn on standard 25 mm/s, 10 mm/mV grid paper. `tools/criteria.mjs` checks every tracing against textbook criteria (rate, regularity, PR, QRS, P:QRS relationship, ST elevation by lead group, voltage). Any that fail are thrown away and regenerated.

## Project layout
```
index.html, css/, js/        the app (app.js router, guide.js Today/plan/hubs, planner.js calendar, quiz.js, pages.js, store.js, ui.js, data.js, ecg.js)
sw.js, manifest.webmanifest  offline support and install metadata
data/                        questions, flashcards, lessons, glossary, medications, image metadata
images/real, images/generated
tools/                       content sources, builders, validator
docs/                        exam outline research and facts to double-check
```

## Privacy
There are no accounts, analytics or server. Progress is stored in your browser's local storage on each device.

## License and credits
Real images keep their original licenses (see `ATTRIBUTION.md`; CC BY-SA files stay CC BY-SA). The question text, generated images and code were created for this project for personal study use.
