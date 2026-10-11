// Keep the original text (and encrypted bytes) while drawing hearts with the favicon.
export function uiText(node, value) {
  const parts = String(value).split('♥');
  node.replaceChildren();
  parts.forEach((part, index) => {
    if (index) {
      const heart = document.createElement('span');
      heart.className = 'game-heart'; heart.textContent = '♥';
      heart.setAttribute('role', 'img'); heart.setAttribute('aria-label', 'heart');
      node.append(heart);
    }
    node.append(document.createTextNode(part));
  });
}
