// Presentation only: no animation can mark a packet sent or an attack successful.
import { uiText } from './ui-text.js';
const animations = new Set();
const flights = new Set();
const receivers = new Set();
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function track(animation) {
  animations.add(animation);
  animation.finished.catch(() => {}).finally(() => animations.delete(animation));
  return animation;
}
export function cancelWindowMotion() {
  for (const animation of animations) animation.cancel();
  animations.clear();
  for (const flight of flights) flight.remove();
  flights.clear();
  for (const receiver of receivers) receiver.classList.remove('receiving-message');
  receivers.clear();
}
export function openFromMessage(windowElement, sourceRect, target, text) {
  if (reduced() || !sourceRect || !sourceRect.width) return;
  const destination = windowElement.getBoundingClientRect();
  const end = target?.getBoundingClientRect();
  const originX = sourceRect.left + sourceRect.width / 2 - destination.left;
  const originY = sourceRect.top + sourceRect.height / 2 - destination.top;
  track(windowElement.animate([
    { transform: 'scale(.06)', transformOrigin: `${originX}px ${originY}px`, opacity: .1 },
    { transform: 'scale(1)', transformOrigin: `${originX}px ${originY}px`, opacity: 1 },
  ], { duration: 460, easing: 'cubic-bezier(.16,1,.3,1)' }));
  if (!target || !text) return;
  const receiver = target.parentElement;
  receiver.classList.add('receiving-message'); receivers.add(receiver);
  const flight = document.createElement('div');
  flight.className = 'message-flight'; uiText(flight, text); flight.setAttribute('aria-hidden', 'true');
  Object.assign(flight.style, { left: sourceRect.left + 'px', top: sourceRect.top + 'px', width: Math.min(sourceRect.width, 440) + 'px' });
  document.body.append(flight); flights.add(flight);
  const x = end.left - sourceRect.left, y = end.top - sourceRect.top;
  const animation = track(flight.animate([
    { transform: 'translate(0, 0)', opacity: 1 },
    { transform: `translate(${x}px, ${y}px)`, opacity: 1, offset: .82 },
    { transform: `translate(${x}px, ${y}px)`, opacity: 0 },
  ], { duration: 480, easing: 'cubic-bezier(.4,0,.2,1)' }));
  animation.finished.catch(() => {}).finally(() => { flight.remove(); flights.delete(flight); receiver.classList.remove('receiving-message'); receivers.delete(receiver); });
}
export async function closePopup(dialog) {
  if (reduced() || !dialog.open) return;
  const animation = track(dialog.animate([
    { transform: 'translateY(0) scale(1)', opacity: 1 },
    { transform: 'translateY(-18px) scale(.88)', opacity: 0 },
  ], { duration: 180, easing: 'ease-in', fill: 'forwards' }));
  await animation.finished.catch(() => {});
  animation.cancel();
}
