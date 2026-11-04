/* Revisión de fotografías: marcar cambios y copiarlos (se recuerdan en este navegador) */
(function () {
  var KEY = 'altabrisa-merida-revision';
  var cards = [].slice.call(document.querySelectorAll('.rv-card'));
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }
  var count = document.getElementById('rvCount'), btn = document.getElementById('rvCopy');

  function state() {
    var s = {};
    cards.forEach(function (c) {
      var on = c.querySelector('input[type=checkbox]').checked, note = c.querySelector('.rv-note').value.trim();
      c.classList.toggle('is-marked', on);
      if (on || note) s[c.getAttribute('data-id')] = { on: on, note: note };
    });
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    var n = cards.filter(function (c) { return c.classList.contains('is-marked'); }).length;
    count.textContent = n === 1 ? '1 foto marcada para cambio' : n + ' fotos marcadas para cambio';
    return s;
  }
  cards.forEach(function (c) {
    var v = saved[c.getAttribute('data-id')];
    if (v) { c.querySelector('input[type=checkbox]').checked = !!v.on; c.querySelector('.rv-note').value = v.note || ''; }
    c.addEventListener('input', state); c.addEventListener('change', state);
  });
  state();

  btn.addEventListener('click', function () {
    var s = state(), lines = [];
    Object.keys(s).forEach(function (k) { if (s[k].on || s[k].note) lines.push('- ' + k + (s[k].on ? ' (cambiar)' : '') + (s[k].note ? ': ' + s[k].note : '')); });
    var txt = lines.length ? 'Plaza Altabrisa Mérida · cambios en fotografías:\n' + lines.join('\n') : 'Plaza Altabrisa Mérida · fotografías aprobadas, sin cambios.';
    var done = function () { var t = btn.textContent; btn.textContent = 'Copiado'; setTimeout(function () { btn.textContent = t; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { window.prompt('Copien este texto:', txt); });
    else window.prompt('Copien este texto:', txt);
  });
})();
