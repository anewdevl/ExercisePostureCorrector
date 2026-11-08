# Pre-merge posture review

November 7, 2026. Owner approved proceeding with cleanup through the pre-merge stage; yoga is deferred until after integration as an optional feature.

## Retention and findings

| Area | Decision / result |
| --- | --- |
| Nine exercise processors | Retained; no wholesale algorithm replacement. |
| Bicep curls | Kept right-arm counting; corrected reversed movement prompts. |
| Hammer curls and pull-ups | Kept existing bilateral elbow thresholds and counting. |
| Shoulder press | Fixed reversed state transitions: bent arms prepare the movement, extension counts the press. |
| Push-ups | Kept count thresholds; replaced shoulder/left-hip/right-hip angle with shoulder/hip/ankle midline alignment. Removed contradictory “Lower more” prompt at very small elbow angles. |
| Squats | Kept existing left-leg count thresholds. Static guidance is not a measured form score. |
| Deadlifts | Kept existing hip/knee thresholds. Needs representative movement calibration before changing thresholds. |
| Lunges | Kept existing detector; its straight trailing-leg requirement and torso projection are camera/view-dependent. Not validated for every lunge variant. |
| Plank | Kept alignment detector. Interrupted position resets the current timer and retains the best hold. |
| Visibility | Replaced the cleanup draft's all-body requirement with the exact joints each processor uses. Hidden ankles no longer block an arm curl. |
| Camera and storage | Retain permission-based browser capture, isolated sessions, retryable/idempotent saving, and actual history. |
| Fake analytics/profile/auth/category screens | Remain removed under the owner's approval of the simplified scope. No authentication is claimed. |
| Yoga | Preserved and disabled; no further work before merge. |
| Unused form-scoring utilities | Remain removed; did not feed the original API. Existing processor overlays remain. |

## Verification

- [x] Ten Python tests pass: session validation, isolation, expiry, no-pose behavior, saving once, interrupted hold, geometry, exercise-specific visibility, push-up alignment, and all eight rep-counting state transitions.
- [x] Held repeated frames do not add duplicate counts in the tested movement sequences.
- [x] Previous browser checks passed for camera denial, synthetic frame processing, stopping tracks, and history.
- [x] AIWorkout live chat and seven-day generation both returned HTTP 200 with the installed local Ollama model. This was one successful live generation, not a guarantee of every model response.
- [ ] Recorded real-movement evaluation across camera positions, clothing, lighting, occlusion, and body proportions remains outstanding. No physical camera was accessed.

## Practical limitations to retain in the merge plan

These are heuristic 2D processors, not clinical posture validation. Existing normalized image-coordinate angles can vary with aspect ratio and camera perspective. Most legacy counters record reaching a target phase rather than completing a full return cycle; preserve that behavior unless deliberately redesigned. Lunge detection and view-dependent cues deserve dataset-based evaluation rather than speculative threshold changes. Arbitrary confidence percentages and calories stay excluded.

The current tracker is local, single-user, and single-process. History is shared on the local machine. Multi-user hosting would require authentication, user-scoped storage, session ownership, and a separate deployment design.

## Proposed merge contract — approval still required

1. Keep AIWorkout's landing page and visual identity as the application shell.
2. Routes: home, plan generator, saved plans, assistant, training, session history, provider settings.
3. Use stable exercise IDs (e.g. bicep-curl, squat, shoulder-press), an alias map for generated names, and an explicit tracking-supported flag. Unknown/generated exercises stay usable in plans without a misleading Start tracking button.
4. Separate WorkoutPlan / PlanExercise records from TrainingSession results. Connect sessions to planned exercises optionally; retain free training.
5. Unify under one Flask API and one React/Vite frontend. Keep inference and provider adapters in separate modules. Preserve the session locks and detector lifecycle.
6. Make Gemini the intended primary provider and Ollama the local option behind one adapter interface. Keep credentials server-side in ignored environment configuration. Configure model names rather than hard-coding a supposedly permanent latest model. Never silently send local-provider requests to a cloud provider.
7. Keep existing /api routes compatible during integration. Explicitly back up and migrate local data; do not import historical demo sessions automatically.
8. Finish with end-to-end checks of generate → edit/save → supported exercise → track → save → history. Retain unsupported exercise plans and clear provider failure states.
9. Yoga remains an optional follow-up module, excluded from the initial navigation and dependencies.

No merge, provider implementation, push, or deployment has occurred. Gemini implementation needs current official API documentation and a user-supplied server-side key for live validation. It can be built with mocked transport tests before any key is supplied.

## Integration follow-up
The owner subsequently authorized integration. AIWorkout-Merged contains the unified app; the standalone posture source remains intact. See ROADMAP.md and AIWorkout-Merged/README.md for current status. Yoga is still deferred.

