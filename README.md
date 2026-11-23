# CCT Study

A free, offline, mobile-friendly study app for the **Cardiovascular Credentialing International (CCI) Certified Cardiographic Technician (CCT)** exam.

> **Study aid only. Not an official CCI product.** It is not affiliated with, sponsored or endorsed by CCI.
> Always confirm exam details at [cci-online.org](https://cci-online.org/credentials/certified-cardiographic-technician/).

**Open it:** https://seanbarrameda501.github.io/CCT-Study/ (once GitHub Pages is turned on; see below).

## What's inside

| | |
|---|---|
| **1,130 questions** | Spread in the official CCI proportions: Pre-Procedural 10%, Resting ECG 14%, 12-Lead Analysis 22%, Stress 10%, Ambulatory 4%, Rhythm Analysis 40%. Every question has an explanation and a source. |
| **Item types like the real exam** | Multiple choice, select-all-that-apply, ordering, and hot spot (tap the PVC, the dropped P wave, or the lead with ST elevation). |
| **466 ECG images** | 16 **REAL** licensed recordings and 450 **GENERATED** tracings (387 rhythm strips and 63 full 12-leads), each labeled. |
| **523 flashcards, 49 mini-lessons, 223 glossary terms** | Lessons appear after every wrong answer and in the Library. |
| **Study tools** | Spaced repetition, a timed 130-question exam, rhythm trainer, calculation practice, rapid fire, weak spots, an 8-week plan, mnemonics, medication reference, printable cheat sheets and lead-placement diagrams. |

Where the official figures came from: [`docs/exam-outline.md`](docs/exam-outline.md).
Facts worth double-checking: [`docs/unverified-facts.md`](docs/unverified-facts.md).
Image credits: [`ATTRIBUTION.md`](ATTRIBUTION.md).

## Turning on GitHub Pages (one time)

1. Merge this work into `main`: on GitHub, open a pull request from `claude/intelligent-gauss-trv3fp` into `main` and merge it.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Set **Branch** to `main` and the folder to **/ (root)**, then click **Save**.
5. Wait 1–2 minutes and refresh the Pages screen. It will show the live link: **https://seanbarrameda501.github.io/CCT-Study/**

If you want to try it before merging, you can choose the `claude/intelligent-gauss-trv3fp` branch in step 4 instead.
The repository must be public for GitHub Pages on a free account.

## Installing it on your phone

1. Open the link in **Safari** on iPhone or **Chrome** on Android.
2. **iPhone:** tap **Share**, then **Add to Home Screen**. **Android:** tap the **⋮** menu, then **Install app** (or **Add to Home screen**).
3. Open the app once while online and leave it open for about a minute. It downloads all questions and images (about 12 MB) for offline use. You can check this under **More → Offline**.

After that it works with no internet connection.

## Using it

- **Profiles.** Tap the 👤 chip at the top right. Each person gets their own progress on a shared phone. Progress lives only on that device.
- **Home.** Shows the readiness meter (estimated chance of passing, plus a countdown to your exam date), streak and daily goal, items due today, and accuracy for each content area. Tap an area to drill it.
- **Study tab.** Quick quiz (10–20), interleaved practice, smart review, topic drill, full practice exam, rhythm trainer, calculations, patient scenarios, rapid fire, flashcards, weak spots, bookmarks and search.
- **Confidence buttons.** After choosing an answer, tap **Sure**, **Unsure** or **Guess** to submit it. Right-but-unsure answers come back for review tomorrow.
- **Spaced repetition.** A missed item returns after 1 day, then 3 days, then 1 week, then 2 weeks. After 4 correct answers in a row it leaves the queue. Flashcards use the same schedule. **Review** shows what is due today.
- **Practice exam.** 130 questions in 2 hours, drawn in the CCI proportions. 20 items are unscored, as on the real exam. You get no feedback until the end, then a pass estimate and a breakdown by area.
- **Library.** Lessons, lead-placement diagrams, glossary (search and drill), memory aids, medication reference, an ECG image gallery, and printable cheat sheets (open one, then Print or Save as PDF).
- **More → Settings.** Exam date, daily goal, dark mode, text size, confidence prompts, and export/import of progress (use this to back up or move to a new phone). There is also a Share button for the link.

### Sharing with a study partner
Send them the link. Each phone keeps its own progress. To move progress between phones, use **Export** on one and **Import** on the other.

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
index.html, css/, js/        the app (app.js, quiz.js, pages.js, store.js, ui.js, data.js, ecg.js)
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
