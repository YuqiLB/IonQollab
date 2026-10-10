// All portraits use supplied artwork. The expression images are lossless crops
// of Screenshot 2026-10-10 164351.png with exterior background removed.
// Source crops are retained. No resampling, recoloring, or face edits.
export const character = Object.freeze({
  name: 'Mira',
  idle: './assets/characters/mira-idle.png',
  thinking: './assets/characters/mira-idle.png',
  flustered: './assets/characters/mira-flustered.png',
  happy: './assets/characters/mira-happy.png',
  source: 'User-supplied QRush asset and expression screenshot',
  expressionsAvailable: ['idle', 'flustered', 'happy'],
  // The supplied expression art is a bust; match its head scale to the full idle art.
  frameWidth: { idle: 1, thinking: 1, flustered: 0.74, happy: 0.74 },
});
