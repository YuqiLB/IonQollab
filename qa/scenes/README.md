# Balcony and desk review

Captured from the running game in headless Chrome by `tests/opening-smoke.cjs`.

| Viewport | Balcony | Desk |
| --- | --- | --- |
| 1440 × 900 | [Desktop](desktop-balcony.png) | [Desktop](desktop-desk.png) |
| 390 × 844 | [Phone](mobile-balcony.png) | [Phone](mobile-desk.png) |
| 320 × 480 | [Compact](compact-balcony.png) | [Compact](compact-desk.png) |
| 844 × 390 | [Landscape](landscape-balcony.png) | [Landscape](landscape-desk.png) |

Both reply branches, keyboard continuation, expression changes, transition to the centered chat, reduced motion, skip, duplicate activation, and reset during transition pass. See `results.json`. The full desktop/mobile encryption story and all 11 math/adapter tests also pass; see [verification](../VERIFICATION.md).

The in-person text box now accepts clicks across its full surface, with Enter/Space as keyboard equivalents. The full-story suite additionally captures the [garden date](../desktop-date-garden.png), [east-dome date](../mobile-date-dome.png), [end screen](../desktop-ending.png), and separate [desktop](../desktop-primes.png) / [phone](../mobile-primes.png) puzzle windows.

These are live HTML UI captures, not the supplied reference pictures. Pixel scene artwork is SVG; Alice uses the unmodified native PNGs. Original fonts load from Google Fonts. No live Qollab or post-quantum computation is claimed by these checks.
