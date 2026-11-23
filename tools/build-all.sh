#!/usr/bin/env bash
# Rebuild every generated data file, then validate. Run from the repo root.
set -euo pipefail
node tools/build-strips.mjs
node tools/build-questions.mjs
node tools/build-content.mjs
node tools/build-attribution.mjs
node tools/validate.mjs
