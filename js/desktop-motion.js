// Presentation only. Story progression and quantum results stay in main.js.
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const running = new Map();

function moveFrom(node, from, duration = 560) {
  running.get(node)?.cancel();
  if (reduceMotion() || !from?.width || !node.getClientRects().length) return;
  const to = node.getBoundingClientRect();
  if (!to.width || !to.height) return;
  // Uniform scaling preserves character proportions while the window moves.
  const scale = Math.min(from.width / to.width, from.height / to.height);
  const animation = node.animate([
    { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${scale})` },
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
  let origin = source?.getBoundingClientRect();
  const history = document.getElementById('messages').getBoundingClientRect();
  if (origin && (origin.bottom < history.top || origin.top > history.bottom)) {
    origin = document.getElementById('restore-puzzle').getBoundingClientRect();
  }
  change();
  moveFrom(chat, before);
  if (origin) moveFrom(document.getElementById('puzzle-window'), origin, 620);
}

export function resetMotion() {
  for (const animation of running.values()) animation.cancel();
  running.clear();
}
