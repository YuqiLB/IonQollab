# Message-owned windows

Live Chrome captures produced by `tests/message-windows.cjs`:

- [Actual invitation traveling into its encryption window](message-opens-window.png)
- [Desktop pending invitation](desktop-encrypting.png)
- [Red Zeno popup over frosted windows](desktop-zeno-popup.png)
- [Phone encryption window](phone-encrypting.png) and [phone Zeno popup](phone-zeno-popup.png)
- [Compact 320px layout](compact-encrypting.png) and [landscape popup](landscape-zeno-popup.png)

The animation capture pauses the real Web Animations API timeline at 180ms, then resumes it. It uses the selected message, not placeholder text. Other captures complete finite animations. `results.json` records every RSA/attack/recovery/PQ step fitting without scrolling, prime errors, Alice's close/restore and attachment controls, pending/sent status, exact decryption for two public moduli, and restart cancellation. Zeno has no close control; Escape and backdrop clicks leave his native modal open until the final recovery action. Rendered hearts share the favicon asset while preserving the actual invitation text.

The full desktop/mobile story suite passes separately. The existing math suite has a failure recorded in [verification](../VERIFICATION.md); the cryptographic modules were not changed by this UI work.
