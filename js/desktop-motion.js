// Presentation only. Story progression and quantum results stay in main.js.
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const running = new Map();

function moveFrom(node, from, duration = 560) {
  running.get(node)?.cancel();
  if (reduceMotion() || !from?.width || !node.getClientRects().length) return;
  const to = node.getBoundingClientRect();
  const animation = node.animate([
    { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})` },
    { transform: 'none' },
  ], { duration, easing: 'cubic-bezier(.22,1,.36,1)' });
  running.set(node, animation);
  animation.finished.catch(() => {}).finally(() => {
    if (running.get(node) === animation) running.delete(node);
  });
}

export function moveWindows(change, source = null) {
  const chat = document.querySelector('.conversation-panel');
  const before = chat.getBoundingClientRect();
  const origin = source?.getBoundingClientRect();
  change();
  moveFrom(chat, before);
  if (origin) moveFrom(document.getElementById('puzzle-window'), origin, 620);
}

export function resetMotion() {
  for (const animation of running.values()) animation.cancel();
  running.clear();
}
