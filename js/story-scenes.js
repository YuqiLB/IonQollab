// The final invitation is the single source of truth for the date location.
export const dateLocations = [
  {
    id: 'garden', name: 'Quiet garden', time: '00:15',
    invitation: 'The quiet garden. 00:15. This time, just us. ♥',
    background: './assets/scenes/garden.svg',
    confirmation: 'It’s a date. I’ll meet you in the garden at 00:15. Two coffees. No intercom. ♥',
    ending: 'Two coffees in the quiet garden. The rest of the night is yours.',
    lines: [
      { speaker: 'Alice', expression: 'happy', text: 'Right on time. I saved you the quiet end of the garden… and the better coffee.' },
      { speaker: 'Bob', expression: 'happy', text: 'No lab coats, no intercom. I could get used to this.' },
      { speaker: 'Alice', expression: 'blushing', text: 'You know, I was hoping you’d ask me out. Even before the cryptography.' },
      { speaker: 'Bob', expression: 'blushing', text: 'Then next time I’ll start with coffee and save the equations for later.' },
      { speaker: 'Alice', expression: 'happy', text: 'Next time? I like the sound of that. Come on. Walk with me.' },
    ],
  },
  {
    id: 'dome', name: 'East dome', time: 'After the late shift',
    invitation: 'New plan: hot chocolate under the east dome?',
    background: './assets/scenes/dome.svg',
    confirmation: 'It’s a date. The east dome, two hot chocolates, and that very distracting smile. ♥',
    ending: 'Hot chocolate under the east dome. One more reason to stay a little longer.',
    lines: [
      { speaker: 'Alice', expression: 'happy', text: 'There you are. The dome’s still open, and I managed not to drink your hot chocolate.' },
      { speaker: 'Bob', expression: 'happy', text: 'Stars, hot chocolate, and you. Definitely better than another hour at my desk.' },
      { speaker: 'Alice', expression: 'blushing', text: 'I usually come here to think. Tonight, I’m happy to be distracted.' },
      { speaker: 'Bob', expression: 'blushing', text: 'Then I’m glad I sent that second invitation.' },
      { speaker: 'Alice', expression: 'happy', text: 'Me too. Sit with me? I don’t think either of us needs to hurry back.' },
    ],
  },
];

// Scripted, occasional companionship. Never claims a computed result.
export const puzzleMessages = {
  'RSA:0': 'Take your time. I’ve waited a whole shift to talk to you. A few more numbers won’t hurt.',
  'RSA:4': 'There’s our invitation, hiding in all those numbers. I still know who it’s from. ♥',
  'INTERCEPT:0': 'Zeno just wheeled that machine past my desk. Please tell me that’s unrelated.',
  'INTERCEPT:1': 'I have a bad feeling about his “quick experiment.” I’m still here, though.',
  'RECOVER:0': 'Tell me what you find. And don’t let him put you off that invitation.',
  'PQ:0': 'For the record, I’m still saying yes to the date.',
  'PQ:2': 'A fresh plan sounds good. Somewhere quiet, just the two of us.',
};
