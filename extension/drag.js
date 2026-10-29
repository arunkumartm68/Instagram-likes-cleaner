(() => {
  'use strict';
  const host = [...document.documentElement.children].find(el => el.shadowRoot?.querySelector('.panel'));
  if (!host) return;
  const heading = host.shadowRoot.querySelector('h2');
  const key = '__igLikesCleanupPanelPosition';
  heading.style.cssText += ';cursor:grab;touch-action:none;user-select:none';
  heading.title = 'Drag to move this panel';
  let drag;
  function place(x, y) {
    const rect = host.getBoundingClientRect();
    const left = Math.max(0, Math.min(x, Math.max(0, innerWidth - rect.width)));
    const top = Math.max(0, Math.min(y, Math.max(0, innerHeight - rect.height)));
    host.style.right = 'auto';
    host.style.left = `${left}px`;
    host.style.top = `${top}px`;
    return {left, top};
  }
  try {
    const position = JSON.parse(localStorage.getItem(key));
    if (Number.isFinite(position?.left) && Number.isFinite(position?.top)) place(position.left, position.top);
  } catch {}
  heading.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const rect = host.getBoundingClientRect();
    drag = {id:event.pointerId, x:event.clientX-rect.left, y:event.clientY-rect.top};
    heading.setPointerCapture(event.pointerId);
    heading.style.cursor = 'grabbing';
    event.preventDefault();
  });
  heading.addEventListener('pointermove', event => {
    if (drag?.id === event.pointerId) place(event.clientX-drag.x, event.clientY-drag.y);
  });
  function finish(event) {
    if (drag?.id !== event.pointerId) return;
    drag = null;
    heading.style.cursor = 'grab';
    const rect = host.getBoundingClientRect();
    try { localStorage.setItem(key, JSON.stringify({left:rect.left, top:rect.top})); } catch {}
  }
  heading.addEventListener('pointerup', finish);
  heading.addEventListener('pointercancel', finish);
  heading.addEventListener('lostpointercapture', finish);
  window.addEventListener('resize', () => {
    const rect = host.getBoundingClientRect();
    place(rect.left, rect.top);
  });
})();
