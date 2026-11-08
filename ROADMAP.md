# AIWorkout + Exercise Posture Corrector roadmap

Updated: November 7, 2026

## Latest owner decision and completed follow-up

The owner approved proceeding through pre-merge cleanup and deferred optional yoga until after merging. Preserve existing exercise logic wherever it works. Conserve remaining usage; avoid an expansive rewrite. Consult before the actual merge.

- [x] Complete focused source audit and keep/fix/remove matrix: see POSTURE_AUDIT.md.
- [x] Repair demonstrated issues in visibility gating, shoulder-press direction, push-up alignment, and curl prompts.
- [x] Validate eight rep-counting transitions and plank interruption with deterministic tests; ten posture backend tests pass.
- [x] Confirm one successful live seven-day plan generation with the installed local model.
- [x] Document the proposed routes, exercise-ID mapping, data separation, provider interface, migration, and merge approval boundary.
- [ ] Validate representative real movement samples; synthetic state tests are not accuracy certification.
- [ ] Implement Gemini/provider support during the agreed integration phase, with separate live-key validation.
- [ ] Owner reviews the merge proposal before any integration begins.

The inventory below records the earlier cleanup pass; this update supersedes its paused/read-only-only status and its older test counts.

## Working agreement

- Preserve AIWorkout's existing landing-page design and artwork.
- Treat existing OpenCV / MediaPipe exercise logic as the baseline to retain, not something to replace wholesale. The owner reports that most of it already worked well.
- Consult the owner before additional implementation, feature removal, or merging.
- Current posture changes are a draft requiring review. No commits have been pushed and no merge has occurred.
- Physical-camera testing requires the owner's agreement. Completed browser camera tests used synthetic video and simulated denial, not the physical webcam.
- Gemini is the intended primary planning provider. Optional provider support belongs in the agreed integration plan.

## Honest inventory of changes already made

### AIWorkout

- [x] Preserve landing artwork, colors, animations, and overall layout; fix CSS typos and mobile behavior.
- [x] Repair workout create/edit/delete, validation, loading, and error feedback.
- [x] Repair local Ollama request handling, bound request time, and isolate chat history by request.
- [x] Retain plan export through browser Print / Save PDF; replace the old PDF-generation dependency.
- [x] Remove the nonfunctional sign-in link, unused scripts/templates/dependencies, duplicate styles, committed Python environment, and bytecode.
- [x] Preserve existing database contents in a local database and an external workspace backup.
- [x] Pass six backend tests and three browser tests, lint, and production build.
- [x] Verify live chat using the already-installed local Ollama model.
- [ ] Confirm live weekly generation reliably produces a valid plan. Mocked output rendering has passed; that is not live-model validation.
- [ ] Add and test Gemini after agreement on provider scope. The checked-out backend used Ollama; Gemini is not implemented in the cleanup.

### Posture tracker: draft changes, not final feature approval

- [x] Retain all nine exercise processors: bicep curls, deadlifts, hammer curls, lunges, plank, pull-ups, push-ups, shoulder press, and squats.
- [x] Verify that eight exercise-specific source files are unchanged. Only plank.py and shared utils.py changed.
- [x] Modify plank timing so leaving the position resets the current hold immediately. This removes the old grace behavior and needs owner review.
- [x] Remove shared utility mock-engine fallback and unused form-evaluation helpers. These helpers are recoverable from Git and must be reviewed before accepting their removal; the old API did not call them.
- [x] Replace server-camera streaming with browser permission and per-session frame processing. Add a full-body visibility gate before running existing processors. This is a meaningful behavior change requiring review against existing working exercises.
- [x] Replace mock history and random performance/calorie/duration values with recorded sessions.
- [x] Replace the old frontend with a simpler training/history draft. Remove profile/auth screens, category pages, camera-test page, and performance-analysis pages from the active UI. Some functions are consolidated; these removals are not yet approved as the final feature set.
- [x] Remove startup scripts/code that created or reset default account passwords, committed environments/builds, and duplicate templates.
- [x] Preserve both old databases in ../local-data-backup (relative to the repository root). Start new history separately; do not silently treat demo entries as real activity.
- [x] Pass five backend tests and two browser tests, lint, and production build.
- [ ] Audit correctness of exercise-specific counting and feedback. Passing infrastructure tests does not validate posture accuracy.

### Yoga

- [x] Preserve original yoga detector source and serialized model/reference files.
- [x] Disable yoga in the active app and avoid eager detector initialization at import time.
- [ ] Decide with the owner whether yoga should return, remain experimental, or be removed.
- [ ] If retained, verify model filenames, serialized model compatibility, expected feature dimensions, reference angles, and actual classification quality.
- [ ] Research maintained public models/resources only if the owner chooses to pursue yoga.

Known issue: the original loader asks for yoga_svm_rbf.pkl and yoga_scaler.pkl, whereas supplied files are yoga_pose_svm.pkl and yoga_pose_scaler.pkl. Its fallback creates unfitted estimators. This is a reason to investigate, not proof that all yoga work is useless.

## Proposed sequence and approval checkpoints

### 1. Read-only posture audit

- [ ] Compare original behavior with the cleanup draft, exercise by exercise.
- [ ] Identify which existing overlay feedback and form evaluation were genuinely working.
- [ ] Review angle calculations, visibility thresholds, rep transition states, plank timing, and camera orientation assumptions.
- [ ] Check whether the new full-body gate is too restrictive for exercises that need fewer joints.
- [ ] Produce a keep / restore / fix / remove matrix, including every removed screen and yoga.
- [ ] Present findings and proposed scope for owner approval before implementation.

### 2. Targeted posture repairs

- [ ] Restore useful features identified by the audit.
- [ ] Keep existing working processor logic and change only demonstrated faults.
- [ ] Validate representative movements with controlled video or landmark fixtures.
- [ ] Validate camera lifecycle, isolated sessions, persistence, reconnects, and error handling.
- [ ] Review UI with the owner before accepting the simplified draft.
- [ ] Obtain approval of the repaired standalone posture app.

### 3. Provider design

- [ ] Agree Gemini-first configuration and optional Ollama/other providers.
- [ ] Define a common chat and structured-plan interface with server-side keys.
- [ ] Define timeouts, errors, model settings, schema validation, and usage/cost visibility where applicable.
- [ ] Verify genuine plan generation through the selected provider.

### 4. Merge proposal — discuss before merging

- [ ] Use AIWorkout as the visual shell and preserve its homepage.
- [ ] Add a training area using the approved posture tracker.
- [ ] Define stable exercise identifiers and map generated exercise names to supported tracking exercises.
- [ ] Keep planned workouts separate from completed sessions; do not imply every generated exercise supports tracking.
- [ ] Agree shared API structure, data migration, navigation, and settings.
- [ ] Decide whether this remains a local single-user tool or needs authentication and hosting; do not quietly add those requirements.
- [ ] Present architecture, feature list, migration risks, and UI flow for explicit owner approval.

Target flow: generate a plan → review/edit/save → select a supported exercise → track movement → save session → review real history.

### 5. Approved merge and final cleanup

- [ ] Integrate on a separate branch with recoverable standalone versions.
- [ ] Back up and migrate actual user data deliberately.
- [ ] Run end-to-end checks across generation, planning, training, and history.
- [ ] Remove confirmed duplicate/dead code and temporary cleanup scripts; retain purposeful tests and documentation.
- [ ] Review the merged experience with the owner.
- [ ] Publish or push only within the owner's agreed scope.

## Current status

Pre-merge audit and targeted repairs are complete. The owner subsequently approved integration with "Continue". The separate AIWorkout-Merged workspace now combines the apps; see the checklist below. Yoga remains deferred. Earlier proposal checkboxes describe the historical consultation stage.

## Integrated workspace — November 7, 2026

The owner's "Continue" authorized the previously proposed integration.

- [x] Create AIWorkout-Merged separately; preserve both standalone folders.
- [x] Keep the original homepage and add training, history, and provider settings.
- [x] Unify Flask API and database while keeping plans and completed sessions separate.
- [x] Map supported exercises conservatively with stable IDs; retain unknown exercises as plan-only.
- [x] Save generated training days into editable workouts and link them to tracking.
- [x] Add explicit Gemini/Ollama adapters and server-only key handling.
- [x] Copy cleaned data without modifying sources or importing demo history.
- [x] Remove temporary integration scripts and verify built app/API routes return HTTP 200.
- [x] Pass 22 Python tests and frontend lint/build.
- [x] Pass all 7 merged browser tests, including mobile navigation, provider persistence, plan-to-tracker flow, and synthetic camera lifecycle.
- [x] Live Gemini validation with the owner's key: gemini-3.5-flash-lite chat and seven-day generation passed on November 7, 2026 using fictional test details; no test workout saved.
- [ ] Real movement accuracy evaluation, when the owner chooses to provide/use samples.
- [ ] Optional yoga after integration; still excluded.
- [ ] Any push/deployment requires the owner's direction.

See AIWorkout-Merged/README.md for run commands, configuration, migration, and remaining limits.

- [x] Fixed Windows JavaScript MIME headers and cached responses on the built-app server; verified rendering in the user's browser and added an asset-serving regression check.


- [x] Add OpenAI, Anthropic, and DeepSeek adapters, per-provider setup links, exact .env path, and Gemini Flash-Lite testing preset. Passed 28 backend tests and frontend lint/build; new cloud providers are not live-validated.

