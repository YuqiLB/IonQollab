// Current game portraits: native renders of the user's editable Aseprite files.
// All five share a 68 × 89 transparent canvas and identical display sizing.
export const character = Object.freeze({
  name: 'Mira',
  idle: './assets/characters/mira-idle-68x89.png',
  blushing: './assets/characters/mira-blushing-68x89.png',
  happy: './assets/characters/mira-happy-68x89.png',
  serious: './assets/characters/mira-serious-68x89.png',
  surprised: './assets/characters/mira-surprised-68x89.png',
  width: 68,
  height: 89,
  expressionsAvailable: Object.freeze(['idle', 'blushing', 'happy', 'serious', 'surprised']),
  descriptions: Object.freeze({
    idle: 'Mira, a blue-haired researcher with glasses and a plum jacket, smiling softly',
    blushing: 'Mira blushing, looking bashful',
    happy: 'Mira laughing with her eyes closed',
    serious: 'Mira looking serious and determined',
    surprised: 'Mira looking surprised, with wide eyes',
  }),
  sources: Object.freeze({
    idle: 'art/character/native_68x89_v001/portrait_68x89_v003.aseprite',
    blushing: 'art/character/expressions_68x89_v001/mira-blushing_68x89.aseprite',
    happy: 'art/character/expressions_68x89_v001/mira-happy_68x89.aseprite',
    serious: 'art/character/expressions_68x89_v001/mira-serious_68x89.aseprite',
    surprised: 'art/character/expressions_68x89_v001/mira-surprised_68x89.aseprite',
  }),
});

export const storyExpressions = Object.freeze({
  INTRO: 'idle',
  INVITE: 'blushing',
  RSA: 'idle',
  INTERCEPT: 'surprised',
  RECOVER: 'surprised',
  CHOICE: 'serious',
  PQ: 'serious',
  RETRY: 'blushing',
  END: 'blushing', // Changes to happy after Mira's final reply.
});
