/* Home — Plaza Altabrisa Mérida: visor de la galería */
(function () {
  var items = [].slice.call(document.querySelectorAll('.gh .gh-item'));
  if (!items.length) return;
  var svg = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'; };
  var lb = document.createElement('div');
  lb.className = 'gh-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Galería de Plaza Altabrisa');
  lb.innerHTML = '<img alt="">' +
    '<button type="button" class="gh-lb-close" aria-label="Cerrar">' + svg('M6 6l12 12M18 6L6 18') + '</button>' +
    '<button type="button" class="gh-lb-prev" aria-label="Anterior">' + svg('M15 6l-6 6 6 6') + '</button>' +
    '<button type="button" class="gh-lb-next" aria-label="Siguiente">' + svg('M9 6l6 6-6 6') + '</button>' +
    '<p class="gh-lb-count" aria-live="polite"></p>';
  document.body.appendChild(lb);
  var img = lb.querySelector('img'), count = lb.querySelector('.gh-lb-count'), i = 0, back = null;

  function show(n) {
    i = (n + items.length) % items.length;
    var it = items[i], th = it.querySelector('img');
    img.src = it.getAttribute('data-full'); img.alt = th ? th.alt : '';
    count.textContent = (i + 1) + ' / ' + items.length;
    var nx = items[(i + 1) % items.length]; (new Image()).src = nx.getAttribute('data-full');
  }
  function open(n) { back = document.activeElement; show(n); lb.classList.add('is-open'); document.body.classList.add('no-scroll'); lb.querySelector('.gh-lb-close').focus({ preventScroll: true }); }
  function close() { lb.classList.remove('is-open'); document.body.classList.remove('no-scroll'); img.removeAttribute('src'); if (back && back.focus) back.focus({ preventScroll: true }); }

  items.forEach(function (it, n) { it.addEventListener('click', function () { open(n); }); });
  lb.querySelector('.gh-lb-close').addEventListener('click', close);
  lb.querySelector('.gh-lb-prev').addEventListener('click', function () { show(i - 1); });
  lb.querySelector('.gh-lb-next').addEventListener('click', function () { show(i + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(i - 1);
    else if (e.key === 'ArrowRight') show(i + 1);
    else if (e.key === 'Tab') {
      var b = [].slice.call(lb.querySelectorAll('button')), k = b.indexOf(document.activeElement);
      e.preventDefault(); b[(k + (e.shiftKey ? -1 : 1) + b.length) % b.length].focus();
    }
  });
  var x0 = null;
  lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1)); x0 = null; });
})();
