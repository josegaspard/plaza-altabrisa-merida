/* Mapa general (formato Plaza Carso, 25-nov-2026): los dos niveles en un solo plano, buscador,
   leyenda que filtra por familia y etiqueta al pasar el cursor. El clic en un local abre la ficha
   de la tienda (modal de site.js). Lee LOCAL_STORE y STORES. */
(function () {
  'use strict';
  var LS = (typeof LOCAL_STORE !== 'undefined' && LOCAL_STORE) ? LOCAL_STORE : {};
  var ST = (typeof STORES !== 'undefined' && Array.isArray(STORES)) ? STORES : [];
  var wrap = document.querySelector('.map-wrap');
  if (!wrap) return;

  function norm(s) { return window.norm ? window.norm(s) : String(s == null ? '' : s).toLowerCase().trim(); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  var FAMS = ['Compras', 'Gastronomía', 'Entretenimiento', 'Servicios'];
  function famKey(f) { return norm(f).replace(/\s+/g, '-'); }
  function famOf(s) { return window.familiaDe ? window.familiaDe(s && s.cat) : 'Compras'; }

  var byName = {};
  ST.forEach(function (s) { if (s && s.name) byName[norm(s.name)] = s; });
  function nameOf(f, l) { return (LS[f] && LS[f][l]) || null; }
  function storeOf(f, l) { var nm = nameOf(f, l); return nm ? (byName[norm(nm)] || { name: nm }) : null; }

  var levelName = {};
  $$('.map-floor[data-level]').forEach(function (f) {
    var c = f.querySelector('.map-floor__name');
    levelName[f.getAttribute('data-level')] = c ? c.textContent.trim() : '';
  });

  /* Cada local: familia, etiqueta accesible y teclado */
  var locals = $$('.m-local[data-local]');
  locals.forEach(function (el) {
    var f = el.getAttribute('data-floor'), l = el.getAttribute('data-local'), s = storeOf(f, l);
    el.setAttribute('data-fam', s ? famKey(famOf(s)) : 'vacio');
    el.setAttribute('aria-label', 'Local ' + l + ', ' + (s ? s.name : 'sin tienda asignada'));
    if (!s) el.setAttribute('aria-disabled', 'true');
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
    });
  });

  /* Etiqueta flotante */
  var tip = document.createElement('div');
  tip.className = 'map-tip'; tip.hidden = true; tip.setAttribute('aria-hidden', 'true');
  wrap.appendChild(tip);
  function showTip(el) {
    var f = el.getAttribute('data-floor'), l = el.getAttribute('data-local'), s = storeOf(f, l);
    tip.innerHTML = '<strong>' + esc(s ? s.name : 'Local ' + l) + '</strong><span>' +
      esc((s ? 'Local ' + l : 'Sin tienda asignada') + (levelName[f] ? ' · ' + levelName[f] : '')) + '</span>';
    var r = el.getBoundingClientRect(), w = wrap.getBoundingClientRect();
    var x = Math.min(Math.max(r.left - w.left + r.width / 2, 90), w.width - 90);
    tip.style.left = x + 'px';
    tip.style.top = (r.top - w.top) + 'px';
    tip.hidden = false;
  }
  function hideTip() { tip.hidden = true; }

  /* Resalte: todas las celdas de la misma tienda (en los dos niveles) */
  var searchHits = null;
  function mark(list) {
    locals.forEach(function (x) { x.classList.toggle('is-hit', !!list && list.indexOf(x) > -1); });
    wrap.classList.toggle('has-hit', !!list);
  }
  function sameStore(el) {
    var nm = nameOf(el.getAttribute('data-floor'), el.getAttribute('data-local'));
    if (!nm) return [el];
    return locals.filter(function (x) { return nameOf(x.getAttribute('data-floor'), x.getAttribute('data-local')) === nm; });
  }
  function restore() { hideTip(); mark(searchHits); }

  function addDirLink(s) {
    var box = document.getElementById('mInfo');
    var modal = document.getElementById('storeModal');
    if (!box || !modal || !modal.classList.contains('is-open') || box.querySelector('.map-dirlink')) return;
    var a = document.createElement('a');
    a.className = 'link-line map-dirlink';
    a.href = 'directorio.html?tienda=' + encodeURIComponent(s.name);
    a.textContent = 'Ver en el directorio';
    box.appendChild(a);
  }

  locals.forEach(function (el) {
    el.addEventListener('mouseenter', function () { mark(sameStore(el)); showTip(el); });
    el.addEventListener('focus', function () { mark(sameStore(el)); showTip(el); });
    el.addEventListener('mouseleave', restore);
    el.addEventListener('blur', restore);
    el.addEventListener('click', function () {
      var s = storeOf(el.getAttribute('data-floor'), el.getAttribute('data-local'));
      hideTip();
      if (s) addDirLink(s); // el modal ya lo abrió site.js
    });
  });

  /* Leyenda por familia (nº de tiendas de toda la plaza); un clic filtra el plano */
  var legend = document.getElementById('mapLegend');
  function paintLegend() {
    if (!legend) return;
    var seen = {}, count = {};
    locals.forEach(function (el) {
      var nm = nameOf(el.getAttribute('data-floor'), el.getAttribute('data-local'));
      if (!nm || seen[norm(nm)]) return;
      seen[norm(nm)] = 1;
      var k = el.getAttribute('data-fam');
      count[k] = (count[k] || 0) + 1;
    });
    var on = wrap.getAttribute('data-filter');
    legend.innerHTML = FAMS.map(function (f) {
      var k = famKey(f);
      return '<button type="button" class="legend-item" data-fam="' + k + '" aria-pressed="' + (on === k ? 'true' : 'false') + '">' +
        '<span class="legend-swatch" style="--sw:var(--fam-' + k + ')"></span><span class="legend-item__name">' + f +
        '</span><span class="legend-item__n">' + (count[k] || 0) + '</span></button>';
    }).join('');
  }
  if (legend) legend.addEventListener('click', function (e) {
    var b = e.target.closest('button.legend-item');
    if (!b) return;
    var k = b.getAttribute('data-fam');
    if (wrap.getAttribute('data-filter') === k) wrap.removeAttribute('data-filter'); else wrap.setAttribute('data-filter', k);
    paintLegend();
  });
  paintLegend();

  /* Buscador: resalta los locales de las tiendas que coinciden */
  var input = document.getElementById('mapSearch'), out = document.getElementById('mapFound');
  if (input) {
    input.addEventListener('input', function () {
      var q = norm(input.value);
      if (!q) { searchHits = null; if (out) out.textContent = ''; restore(); return; }
      searchHits = locals.filter(function (el) {
        var nm = nameOf(el.getAttribute('data-floor'), el.getAttribute('data-local'));
        return nm && norm(nm).indexOf(q) > -1;
      });
      var names = {};
      searchHits.forEach(function (el) { names[nameOf(el.getAttribute('data-floor'), el.getAttribute('data-local'))] = 1; });
      var n = Object.keys(names).length;
      if (out) out.textContent = n ? (n === 1 ? Object.keys(names)[0] : n + ' tiendas') : 'Sin resultados';
      if (!searchHits.length) searchHits = [];
      restore();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && searchHits && searchHits.length) {
        e.preventDefault();
        searchHits[0].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    });
  }
})();
