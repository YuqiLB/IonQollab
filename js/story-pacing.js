// Reading time is separate from animation: reduced motion keeps Alice's pauses.
export const wordCount = text => String(text).trim().split(/\s+/).filter(Boolean).length;
export const typingDelay = text => Math.min(2600, Math.max(1300, 900 + wordCount(text) * 65));
export const readingGap = text => Math.min(1000, 450 + wordCount(text) * 30);

export function revealWords(elements, { pace = 110, onComplete = () => {} } = {}) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const words = []; let elapsed = 0, last = null, frame, cancelled = false, complete = false, shown = 0;
  for (const node of elements) {
    const text = node.querySelector(':scope > .sr-only')?.textContent || node.textContent;
    const accessible = document.createElement('span'); accessible.className = 'sr-only'; accessible.textContent = text;
    const visual = document.createElement('span'); visual.className = 'word-reveal'; visual.setAttribute('aria-hidden','true');
    node.replaceChildren(accessible, visual);
    for (const word of text.trim().split(/\s+/)) {
      const span = document.createElement('span'); span.textContent = word; span.className = 'reveal-word';
      visual.append(span, document.createTextNode(' ')); words.push({span, at:elapsed});
      elapsed += pace + (/[.!?…]$/.test(word) ? 260 : /[,;:]$/.test(word) ? 120 : 0);
    }
    elapsed += 320;
  }
  const duration = elapsed;
  elapsed = 0;
  const finish = () => {
    if (cancelled || complete) return;
    for (const {span} of words) span.classList.add('visible');
    complete = true; cancelAnimationFrame(frame); onComplete();
  };
  const tick = now => {
    if (cancelled || complete) return;
    if (last !== null && !document.hidden) elapsed += Math.min(now-last,100);
    last = now;
    while (shown<words.length && words[shown].at<=elapsed) words[shown++].span.classList.add('visible');
    if (reduced.matches || elapsed>=duration) finish(); else frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return { get running() { return !complete && !cancelled; }, finish, cancel() {cancelled=true;cancelAnimationFrame(frame);} };
}
