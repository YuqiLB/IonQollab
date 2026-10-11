// Local, player-paced dialogue. Branches change only this immediate reaction.
export const balconyReplies = [
  'Needed a break from my desk.',
  'I could ask you the same thing.',
];

export function balconyBeat(step, choice = 0) {
  const beats = [
    { speaker: 'Alice', expression: 'idle', text: 'You’re still here? I thought I was the only one working this late.' },
    { speaker: 'Bob', expression: 'idle', text: balconyReplies[choice] },
    choice === 0
      ? { speaker: 'Alice', expression: 'happy', text: 'Then you picked a good place. It’s quieter out here. Mind if I walk with you?' }
      : { speaker: 'Alice', expression: 'blushing', text: 'Fair point. I was going to say “one more experiment,” but this is a much better excuse to stay.' },
    { speaker: 'Alice', expression: 'blushing', text: 'We should probably head back before someone comes looking for us. But… I’d like to keep talking.' },
    { speaker: 'Bob', expression: 'blushing', text: 'I’ll message you when I’m back at my desk.' },
    { speaker: 'Alice', expression: 'happy', text: 'I’ll be waiting, Bob.' },
  ];
  return { ...beats[step], last: step === beats.length - 1 };
}
