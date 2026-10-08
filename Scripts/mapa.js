/* Mapa por niveles — Plaza Altabrisa Mérida
   Lee LOCAL_STORE (local → tienda por nivel) y STORES (fichas). Selector de nivel, color por familia,
   ficha lateral al pasar o tocar un local, listado de locales y enlace al directorio.
   El modal de tienda es el de site.js (openStore). Deep link: mapa.html?tienda=<nombre>. */
(function () {
  'use strict';
  var LS = (typeof LOCAL_STORE !== 'undefined' && LOCAL_STORE) ? LOCAL_STORE : {};
  var ST = (typeof STORES !== 'undefined' && Array.isArray(STORES)) ? STORES : [];
  var card = document.querySelector('.map-card');
  if (!card) return;

  function norm(s) { return window.norm ? window.norm(s) : String(s == null ? '' : s).toLowerCase().trim(); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function famOf(s) { return window.familiaDe ? window.familiaDe(s && s.cat) : 'Compras'; }
  function famCls(f) { return window.famClass ? window.famClass(f) : 'fam-compras'; }
  function natural(a, b) {
    var na = parseInt(a, 10), nb = parseInt(b, 10);
    if (na !== nb && !isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b), 'es');
  }
  function pretty(t) { t = String(t || ''); if (norm(t) === 'proximamente') return 'Próximamente'; return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase(); }

  var byName = {};
  ST.forEach(function (s) { if (s && s.name) byName[norm(s.name)] = s; });
  var FLOOR_NAME = {};
  $$('.tab[data-floor]').forEach(function (t) { FLOOR_NAME[t.getAttribute('data-floor')] = t.childNodes[0].textContent.trim(); });
  function floorKeyOf(label) {
    for (var k in FLOOR_NAME) if (norm(FLOOR_NAME[k]) === norm(label)) return k;
    return null;
  }

  function nameOf(f, l) { return (LS[f] && LS[f][l]) || null; }
  function storeOf(f, l) { var nm = nameOf(f, l); return nm ? byName[norm(nm)] || null : null; }
  /* Estado de un local: tienda del directorio, rótulo del gestor sin ficha (p. ej. «PROXIMAMENTE») o vacío */
  function stateOf(f, l, forced) {
    var s = forced || storeOf(f, l), raw = nameOf(f, l);
    if (s) return { store: s, fam: famOf(s), label: s.name };
    if (raw) return { store: null, fam: null, label: pretty(raw) };
    return { store: null, fam: null, label: 'Sin tienda asignada' };
  }

  var canHover = !window.matchMedia || window.matchMedia('(hover: hover)').matches;
  var locals = $$('.m-local[data-local]');
  var elByKey = {};
  locals.forEach(function (el) {
    var f = el.getAttribute('data-floor'), l = el.getAttribute('data-local'), st = stateOf(f, l);
    elByKey[f + '|' + l] = el;
    el.classList.add(st.store ? famCls(st.fam) : 'fam-libre');
    if (!st.store) el.classList.add('is-free');
    el.setAttribute('aria-label', 'Local ' + l + ', ' + st.label);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(f, l); }
    });
    if (canHover) el.addEventListener('mouseenter', function () { preview(f, l); });
    el.addEventListener('focus', function () { preview(f, l); });
    el.addEventListener('click', function () { select(f, l); });
  });

  /* Nº de tiendas por nivel en las pestañas */
  $$('[data-count]').forEach(function (b) {
    var f = b.getAttribute('data-count'), seen = {};
    Object.keys(LS[f] || {}).forEach(function (l) { var s = storeOf(f, l); if (s) seen[norm(s.name)] = 1; });
    var nTiendas = Object.keys(seen).length;
    b.textContent = nTiendas ? String(nTiendas) : '';
    b.hidden = !nTiendas;
  });

  /* Ficha lateral */
  var ui = {
    logo: document.getElementById('miLogo'), kicker: document.getElementById('miKicker'),
    name: document.getElementById('miName'), meta: document.getElementById('miMeta'),
    actions: document.getElementById('miActions'), open: document.getElementById('miOpen'), dir: document.getElementById('miDir')
  };
  var selected = null; // {f, l, store}
  function paint(sel) {
    if (!ui.name) return;
    var f = sel ? sel.f : current();
    if (!sel) {
      ui.logo.hidden = true; ui.logo.innerHTML = '';
      ui.kicker.textContent = FLOOR_NAME[f] || '';
      ui.kicker.className = 'mi-kicker';
      ui.name.textContent = 'Elige un local';
      ui.meta.textContent = 'Pasa el cursor o toca un local del plano para ver la tienda.';
      ui.actions.hidden = true;
      return;
    }
    var st = stateOf(sel.f, sel.l, sel.store), s = st.store;
    if (s && s.logo) {
      ui.logo.innerHTML = '<img src="' + esc(s.logo) + '" alt="' + esc(s.name) + '" width="96" height="72" decoding="async">';
      ui.logo.hidden = false;
      ui.logo.firstChild.addEventListener('error', function () { ui.logo.hidden = true; });
    } else { ui.logo.hidden = true; ui.logo.innerHTML = ''; }
    ui.kicker.textContent = s ? st.fam : (FLOOR_NAME[sel.f] || '');
    ui.kicker.className = 'mi-kicker' + (s ? ' is-fam ' + famCls(st.fam) : '');
    ui.name.textContent = st.label;
    var meta = [sel.l ? 'Local ' + sel.l : '', FLOOR_NAME[sel.f] || ''];
    if (s && s.time) meta.push(s.time);
    if (!elByKey[sel.f + '|' + sel.l]) meta.push('sin ubicación en el plano');
    ui.meta.textContent = meta.filter(Boolean).join(' · ');
    ui.actions.hidden = !s;
    if (s) {
      ui.dir.href = 'directorio.html?tienda=' + encodeURIComponent(s.name);
      ui.open.onclick = function () { if (window.openStore) window.openStore(s.name); };
    }
  }

  /* Resalte: el local y los demás locales de la misma tienda en ese nivel */
  function highlight(sel, cls) {
    locals.forEach(function (x) { x.classList.remove(cls); });
    if (!sel) return;
    var key = sel.store ? norm(sel.store.name) : null;
    locals.forEach(function (x) {
      var f = x.getAttribute('data-floor'), l = x.getAttribute('data-local');
      if (f !== sel.f) return;
      var s = storeOf(f, l);
      if (l === sel.l || (key && s && norm(s.name) === key)) x.classList.add(cls);
    });
  }
  function preview(f, l) {
    var sel = { f: f, l: l, store: storeOf(f, l) };
    highlight(sel, 'is-hit'); paint(sel);
  }
  function restore() { highlight(null, 'is-hit'); paint(selected); }
  function select(f, l, store) {
    if (current() !== f) setFloor(f);
    selected = { f: f, l: l, store: store || storeOf(f, l) };
    highlight(selected, 'is-sel'); highlight(null, 'is-hit'); paint(selected);
    $$('.map-list button').forEach(function (b) {
      b.classList.toggle('is-sel', b.getAttribute('data-f') === f && b.getAttribute('data-l') === l);
    });
  }
  $$('.m-svg').forEach(function (svg) {
    svg.addEventListener('mouseleave', restore);
    svg.addEventListener('focusout', function (e) { if (!svg.contains(e.relatedTarget)) restore(); });
  });

  /* Lleva el local a la vista dentro del plano desplazable (móvil) */
  function reveal(f, l) {
    var el = elByKey[f + '|' + l];
    if (!el) return;
    var sc = el.closest('.map-scroll');
    if (sc && sc.scrollWidth > sc.clientWidth) {
      var r = el.getBoundingClientRect(), rs = sc.getBoundingClientRect();
      sc.scrollLeft += (r.left + r.width / 2) - (rs.left + rs.width / 2);
    }
    var cr = card.getBoundingClientRect();
    if (cr.top < 0 || cr.top > window.innerHeight * .5) {
      window.scrollTo({ top: window.scrollY + cr.top - (parseInt(getComputedStyle(document.documentElement).scrollPaddingTop, 10) || 90), behavior: 'smooth' });
    }
  }

  /* Listado de locales por nivel (todos los del plano y del listado del gestor) */
  $$('.map-list[data-floor]').forEach(function (ul) {
    var f = ul.getAttribute('data-floor');
    var keys = Object.keys(LS[f] || {});
    locals.forEach(function (el) { if (el.getAttribute('data-floor') === f && keys.indexOf(el.getAttribute('data-local')) < 0) keys.push(el.getAttribute('data-local')); });
    keys.sort(natural);
    ul.innerHTML = keys.map(function (l) {
      var st = stateOf(f, l);
      return '<li><button type="button" class="ml-item ' + (st.store ? famCls(st.fam) : 'fam-libre is-free') + '" data-f="' + f + '" data-l="' + esc(l) + '">' +
        '<span class="ml-num">' + esc(l) + '</span><span class="ml-name">' + esc(st.label) + '</span></button></li>';
    }).join('');
    ul.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-l]');
      if (!b) return;
      select(f, b.getAttribute('data-l'));
      reveal(f, b.getAttribute('data-l'));
    });
  });

  /* Niveles */
  var tabs = $$('.tab[data-floor]');
  var listTitle = document.getElementById('mapListTitle');
  function current() { var t = document.querySelector('.tab[data-floor][aria-pressed="true"]'); return t ? t.getAttribute('data-floor') : 'pb'; }
  function setFloor(f) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-floor') === f;
      t.setAttribute('aria-pressed', on ? 'true' : 'false'); t.classList.toggle('is-active', on);
    });
    $$('.map-floor[data-floor]').forEach(function (p) { p.hidden = p.getAttribute('data-floor') !== f; });
    $$('.map-list[data-floor]').forEach(function (u) { u.hidden = u.getAttribute('data-floor') !== f; });
    if (listTitle) listTitle.textContent = 'Locales de ' + (FLOOR_NAME[f] || '');
    if (selected && selected.f !== f) { selected = null; highlight(null, 'is-sel'); }
    restore();
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { setFloor(t.getAttribute('data-floor')); }); });

  /* ?tienda=<nombre> (desde el modal del directorio: «Ver en el mapa») */
  function fromQuery() {
    var q = null;
    try { q = new URLSearchParams(location.search).get('tienda'); } catch (e) {}
    if (!q) return false;
    var s = window.findStore ? window.findStore(q) : byName[norm(q)];
    if (!s) return false;
    var hit = null;
    Object.keys(LS).some(function (f) {
      return Object.keys(LS[f]).sort(natural).some(function (l) {
        var x = storeOf(f, l);
        if (x && norm(x.name) === norm(s.name) && elByKey[f + '|' + l]) { hit = { f: f, l: l }; return true; }
        return false;
      });
    });
    if (!hit && s.num) hit = { f: floorKeyOf(s.loc) || current(), l: String(s.num) };
    if (!hit) return false;
    select(hit.f, hit.l, s);
    setTimeout(function () { reveal(hit.f, hit.l); }, 80);
    return true;
  }

  setFloor(current());
  fromQuery();
})();
