# Motion scenes for Qrush

Built on a71d9c1. These are native SVG/JavaScript animations inside the existing game, not embedded videos. No Manim, build step, or new package is required.

## Flow and pacing

- Encryption: 13 seconds. The player's actual primes combine; the actual invitation becomes ciphertext and an envelope. One final decision sends it to Alice.
- Packet flight: 1.4 seconds into the existing blurred Zeno interruption.
- Attack: 22 seconds. Actual modular residues transition into conceptual interference, returned phase measurements, verified factors, and the actual decrypted invitation.
- Protection upgrade: 11 seconds. An illustrative ML-KEM exchange leads to matching shared secrets and the next invitation.

The three explanations total 46 seconds, plus the packet transition. Reading, decisions, dialogue, opening, and ending add to that; this is not a guarantee that any user-paced playthrough finishes in three minutes.

Pause/replay/skip are available. Minimized windows, the math dialog, and background tabs suspend progression. Reduced-motion preferences replace smooth scene changes with discrete stages and disable the packet flight. Technical details remain under Inspect the math.

## Result integrity

The attack timeline is held at 12.5 seconds until the existing adapter returns a verified success and main.js decrypts the copied packet. Skip cannot bypass this gate. Failed/inconclusive attacks stay encrypted. Switching from an unavailable live connection to the illustrative sample requires an explicit action. Replay does not submit another job.

The waves illustrate interference; they are not a simulation of the actual circuit state. The gold curve is the sum of the other two. Sample versus live results are labeled. The post-quantum exchange remains an illustration, not implemented cryptography.

Background: [IBM's Shor tutorial](https://quantum.cloud.ibm.com/docs/en/tutorials/shors-algorithm) and [NIST ML-KEM standard](https://csrc.nist.gov/pubs/fips/203/final).

## Files

- main.js: connects the scenes to existing game states and controls.
- index.html: stylesheet and pause control; explanatory wording.
- js/story-motion.js: SVG scenes and packet transition.
- js/scene-clock.js: pause/replay/skip and verified-result gate.
- styles/story-motion.css: vector styling within pixel windows and responsive rules.
- tests/scene-clock.test.mjs: four tests for gate, pause, replay, and timing limits.

RSA, the quantum adapter, Python backend, character assets, invitation choices, and date scenes are unchanged.

## Validation, 2026-10-11

- New timeline tests: 4/4 pass. Main and animation module syntax checks and git diff --check pass.
- Browser checked: blank prime validation; p=3/q=11 and p=3/q=5; actual recovery of both invitation choices; pause/replay/skip; math-dialog suspension; minimize/resume; live-disconnected failure and explicit demo choice; completed encryption/attack/upgrade sequences; new invitation and ending. Skipping immediately after starting a sample attack visibly held at 12.5 seconds until the verified result arrived. The final recovered invitation is also exposed in the SVG's accessible label.
- Attack layout checked at 1280x720, 390x844, and 320x480, without horizontal overflow or stage scrolling. Browser console showed no errors or warnings during the checked flow.
- Live quantum hardware was not connected or tested. Reduced-motion behavior is implemented but was not exercised through browser media emulation in this run.
- Existing math suite: 10/11 pass. The existing malformed/contradictory-output test fails at tests/math.test.mjs:59 because the unchanged adapter accepts an unused recovered_toy_secret field. This failure was reproduced before the motion changes; these changes do not modify that contract.
- Legacy browser scripts ui-smoke.cjs and message-windows.cjs still contain old seven-slide navigation assumptions. They were not used to validate the new flow; browser checks above were performed directly in the running app.
