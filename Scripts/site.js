/* Plaza Altabrisa Mérida — JS compartido (sin dependencias).
   Datos que lee de la página (si existen): const STORES, const EVENTS. */
(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  function norm(s) {
    return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function val(v) { return v == null ? '' : String(v).trim(); }
  function slug(s) { return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function setInert(on, keep) {
    ['.site-header', 'main', '.site-footer', '.mob-panel', '.skip'].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (keep && (el === keep || el.contains(keep))) return;
        if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert');
      });
    });
  }
  function trapTab(e, box) {
    if (e.key !== 'Tab' || !box) return;
    var f = Array.prototype.filter.call(box.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'),
      function (el) { return !el.disabled && !el.hidden && el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || !box.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !box.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  }
  function qs(name) { try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; } }

  var ICON = {
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    web: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>',
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>',
    fb: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21h3z"/></svg>',
    tel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
  };

  /* ---------- Giro del gestor → familia del diseño ---------- */
  var FAMILIAS = ['Compras', 'Gastronomía', 'Entretenimiento', 'Servicios'];
  var GIRO_FAMILIA = {
    'accesorios': 'Compras', 'bolsas': 'Compras', 'deportes': 'Compras', 'dulces': 'Compras',
    'especialidades': 'Compras', 'hogar': 'Compras', 'ropa interior': 'Compras', 'joyerias': 'Compras',
    'joyerias y relojerias': 'Compras', 'jugueterias': 'Compras', 'moda caballeros': 'Compras',
    'moda dama y caballero': 'Compras', 'moda damas': 'Compras', 'ninos': 'Compras', 'perfumerias': 'Compras',
    'regalos': 'Compras', 'ropa de playa': 'Compras', 'supermercado': 'Compras', 'tecnologia': 'Compras',
    'tiendas departamentales': 'Compras', 'zapaterias': 'Compras', 'mascotas': 'Compras', 'libreria': 'Compras',
    'alimentos': 'Gastronomía', 'comida rapida': 'Gastronomía', 'restaurantes': 'Gastronomía',
    'cafeteria': 'Gastronomía', 'cafeterias': 'Gastronomía', 'food court': 'Gastronomía',
    'entretenimiento': 'Entretenimiento', 'cine': 'Entretenimiento', 'cines': 'Entretenimiento',
    'gimnasio': 'Entretenimiento', 'fitness': 'Entretenimiento',
    'agencias de viajes': 'Servicios', 'bancos': 'Servicios', 'belleza': 'Servicios', 'opticas': 'Servicios',
    'salud': 'Servicios', 'telefonia': 'Servicios', 'academias': 'Servicios', 'servicios': 'Servicios'
  };
  function familiaDe(cat) { return GIRO_FAMILIA[norm(cat)] || 'Compras'; }
  function famClass(f) { return 'fam-' + slug(f); }

  function stores() { try { return Array.isArray(STORES) ? STORES : []; } catch (e) { return []; } }
  function events() { try { return Array.isArray(EVENTS) ? EVENTS : []; } catch (e) { return []; } }
  function findStore(name) {
    var n = norm(name), list = stores();
    for (var i = 0; i < list.length; i++) if (norm(list[i].name) === n) return list[i];
    for (var j = 0; j < list.length; j++) if (norm(list[j].name).indexOf(n) === 0) return list[j];
    return null;
  }
  function byName(a, b) { return norm(a.name).localeCompare(norm(b.name), 'es'); }

  function linkWeb(u) { u = val(u); if (!u) return ''; return /^https?:\/\//i.test(u) ? u : 'https://' + u.replace(/^\/+/, ''); }
  function linkIg(u) { u = val(u); if (!u) return ''; if (/^https?:\/\//i.test(u)) return u; if (/instagram\.com/i.test(u)) return 'https://' + u.replace(/^\/+/, ''); return 'https://www.instagram.com/' + u.replace(/^@/, '') + '/'; }
  function linkFb(u) { u = val(u); if (!u) return ''; if (/^https?:\/\//i.test(u)) return u; if (/facebook\.com/i.test(u)) return 'https://' + u.replace(/^\/+/, ''); return 'https://www.facebook.com/' + u.replace(/^@/, ''); }
  function telDigits(t) { var d = val(t).replace(/\D/g, ''); if (d.length > 10 && d.indexOf('01') === 0) d = d.slice(2); return d.length > 10 ? d.slice(-10) : d; }

  function logoHTML(s, cls) {
    var logo = val(s.logo);
    if (logo) return '<img src="' + esc(logo) + '" alt="' + esc(s.name) + '" loading="lazy" decoding="async"' + (cls ? ' class="' + cls + '"' : '') + '>';
    var ini = val(s.name).replace(/[^A-Za-zÀ-ÿ0-9 ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
    return '<span class="store-ph" aria-hidden="true">' + esc(ini || '·') + '</span>';
  }
  function cardHTML(s, asLink) {
    var fam = famClass(familiaDe(s.cat));
    var inner = '<span class="store-logo">' + logoHTML(s) + '</span><span class="store-name">' + esc(s.name) + '</span>';
    if (asLink) return '<a class="store-card ' + fam + '" href="directorio.html?tienda=' + encodeURIComponent(val(s.name)) + '">' + inner + '</a>';
    return '<button type="button" class="store-card ' + fam + '" data-store="' + esc(s.name) + '" aria-label="' + esc(s.name) + '">' + inner + '</button>';
  }

  /* ---------- Cabecera y menú móvil ---------- */
  function initHeader() {
    var root = document.documentElement, hdr = document.querySelector('.site-header'), btn = document.querySelector('.nav-toggle');
    function setOpen(open) {
      root.classList.toggle('nav-open', open);
      document.body.classList.toggle('no-scroll', open);
      if (btn) { btn.setAttribute('aria-expanded', open ? 'true' : 'false'); btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú'); }
      document.querySelectorAll('main, .site-footer, .skip').forEach(function (el) { if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
      if (open) setTimeout(function () { var a = document.querySelector('.mob-panel a'); if (a) a.focus({ preventScroll: true }); }, 240);
    }
    if (btn) btn.addEventListener('click', function () { setOpen(!root.classList.contains('nav-open')); });
    document.querySelectorAll('.mob-panel a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) {
      if (!root.classList.contains('nav-open')) return;
      if (e.key === 'Escape') { setOpen(false); if (btn) btn.focus(); return; }
      if (e.key === 'Tab') {
        var f = [btn].concat(Array.prototype.slice.call(document.querySelectorAll('.mob-panel a')));
        var i = f.indexOf(document.activeElement);
        if (i < 0 || (e.shiftKey && i === 0) || (!e.shiftKey && i === f.length - 1)) { e.preventDefault(); f[e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : 0].focus(); }
      }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 960) setOpen(false); });
    if (hdr) {
      var onScroll = function () { hdr.classList.toggle('is-scrolled', window.scrollY > 8); };
      window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    }
  }

  /* ---------- Aparición suave ---------- */
  function initReveal() {
    var els = document.querySelectorAll('.rv');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .05 });
    els.forEach(function (el) { io.observe(el); });
    window.addEventListener('beforeprint', function () { els.forEach(function (el) { el.classList.add('is-in'); }); });
  }

  /* ---------- Modal de tienda ---------- */
  var modal, gal = { imgs: [], i: 0, logo: false }, storeFocus = null;
  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'modal'; modal.id = 'storeModal';
    modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'storeModalName');
    modal.innerHTML = '<div class="modal-box"><button type="button" class="modal-close" aria-label="Cerrar">' + ICON.close + '</button>' +
      '<div class="gal"><div class="gal-main"><img alt=""><button type="button" class="gal-nav gal-prev" aria-label="Foto anterior">' + ICON.left + '</button>' +
      '<button type="button" class="gal-nav gal-next" aria-label="Foto siguiente">' + ICON.right + '</button></div><div class="gal-thumbs"></div></div>' +
      '<div class="modal-info"></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeStore(); });
    modal.querySelector('.modal-close').addEventListener('click', closeStore);
    modal.querySelector('.gal-prev').addEventListener('click', function () { showGal(gal.i - 1); });
    modal.querySelector('.gal-next').addEventListener('click', function () { showGal(gal.i + 1); });
    modal.querySelector('.gal-thumbs').addEventListener('click', function (e) { var b = e.target.closest('button[data-i]'); if (b) showGal(+b.getAttribute('data-i')); });
    return modal;
  }
  function showGal(i) {
    var n = gal.imgs.length; if (!n) return;
    gal.i = (i + n) % n;
    var main = modal.querySelector('.gal-main'), img = main.querySelector('img');
    img.src = gal.imgs[gal.i]; main.classList.toggle('is-logo', gal.logo);
    modal.querySelectorAll('.gal-thumbs button').forEach(function (b, k) { b.classList.toggle('is-on', k === gal.i); });
  }
  function openStore(nameOrStore) {
    var s = typeof nameOrStore === 'object' ? nameOrStore : findStore(nameOrStore);
    if (!s) return false;
    ensureModal(); if (!modal.classList.contains('is-open')) storeFocus = document.activeElement;
    var imgs = (Array.isArray(s.imgs) ? s.imgs : []).map(val).filter(Boolean);
    if (!imgs.length && val(s.img)) imgs = [val(s.img)];
    gal.logo = !imgs.length; gal.imgs = imgs.length ? imgs : (val(s.logo) ? [val(s.logo)] : []);
    var galEl = modal.querySelector('.gal');
    galEl.hidden = !gal.imgs.length;
    modal.querySelector('.gal-main img').alt = val(s.name);
    modal.querySelectorAll('.gal-nav').forEach(function (b) { b.hidden = gal.imgs.length < 2; });
    var th = modal.querySelector('.gal-thumbs');
    th.hidden = gal.imgs.length < 2;
    th.innerHTML = gal.imgs.length > 1 ? gal.imgs.map(function (u, k) { return '<button type="button" data-i="' + k + '" aria-label="Foto ' + (k + 1) + '"><img src="' + esc(u) + '" alt="" loading="lazy"></button>'; }).join('') : '';
    modal.querySelector('.modal-box').classList.toggle('no-gal', !gal.imgs.length);

    var fam = familiaDe(s.cat), rows = [];
    if (val(s.cat)) rows.push(['Giro', esc(val(s.cat).charAt(0) + val(s.cat).slice(1).toLowerCase())]);
    if (val(s.num)) rows.push(['Local', esc(val(s.num))]);
    if (val(s.loc)) rows.push(['Ubicación', esc(val(s.loc))]);
    if (val(s.time)) rows.push(['Horario', esc(val(s.time))]);
    if (val(s.tel)) rows.push(['Teléfono', '<a href="tel:' + telDigits(s.tel) + '">' + esc(val(s.tel)) + '</a>']);
    var acts = [];
    if (linkWeb(s.web)) acts.push('<a class="btn btn-line" href="' + esc(linkWeb(s.web)) + '" target="_blank" rel="noopener">' + ICON.web + 'Sitio web</a>');
    var soc = '';
    if (linkIg(s.ig)) soc += '<a href="' + esc(linkIg(s.ig)) + '" target="_blank" rel="noopener" aria-label="Instagram de ' + esc(s.name) + '">' + ICON.ig + '</a>';
    if (linkFb(s.fb)) soc += '<a href="' + esc(linkFb(s.fb)) + '" target="_blank" rel="noopener" aria-label="Facebook de ' + esc(s.name) + '">' + ICON.fb + '</a>';
    if (soc) acts.push('<div class="social">' + soc + '</div>');
    if (val(s.num) && !/mapa\.html$/.test(location.pathname)) acts.push('<a class="link-arrow" href="mapa.html?tienda=' + encodeURIComponent(val(s.name)) + '">Ver en el mapa' + ICON.right + '</a>');

    modal.querySelector('.modal-info').innerHTML =
      (val(s.logo) && !gal.logo ? '<div class="modal-logo">' + logoHTML(s) + '</div>' : '') +
      '<span class="chip ' + famClass(fam) + '">' + esc(fam) + '</span>' +
      '<h2 class="modal-name" id="storeModalName">' + esc(s.name) + '</h2>' +
      (val(s.desc) ? '<p class="modal-desc">' + esc(val(s.desc)) + '</p>' : '') +
      (rows.length ? '<dl class="info-list">' + rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>' : '') +
      (acts.length ? '<div class="modal-actions">' + acts.join('') + '</div>' : '');
    showGal(0);
    modal.classList.add('is-open'); document.body.classList.add('no-scroll'); setInert(true, modal);
    modal.querySelector('.modal-close').focus({ preventScroll: true });
    return true;
  }
  function closeStore() {
    if (!modal || !modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open'); document.body.classList.remove('no-scroll'); setInert(false);
    if (/[?&]tienda=/.test(location.search)) { try { var u = new URL(location.href); u.searchParams.delete('tienda'); history.replaceState(null, '', u); } catch (e) {} }
    if (storeFocus && storeFocus.focus) storeFocus.focus({ preventScroll: true });
  }

  /* ---------- Directorio ---------- */
  function initDirectory() {
    var grid = document.getElementById('dirGrid');
    if (!grid) return;
    var tabsEl = document.getElementById('dirTabs'), input = document.getElementById('dirSearch'), countEl = document.getElementById('dirCount');
    var list = stores().filter(function (s) { return s && val(s.name); }).slice().sort(byName);
    var state = { fam: 'Todo', q: '' };
    var famCount = { Todo: list.length };
    FAMILIAS.forEach(function (f) { famCount[f] = 0; });
    list.forEach(function (s) { famCount[familiaDe(s.cat)]++; });

    var reqCat = qs('cat');
    if (reqCat) FAMILIAS.forEach(function (f) { if (norm(f) === norm(reqCat)) state.fam = f; });

    if (tabsEl) {
      tabsEl.setAttribute('role', 'group'); tabsEl.setAttribute('aria-label', 'Familias');
      tabsEl.innerHTML = ['Todo'].concat(FAMILIAS).map(function (f) {
        return '<button type="button" class="tab' + (f === state.fam ? ' is-active' : '') + '" data-fam="' + f + '" aria-pressed="' + (f === state.fam) + '">' + f + ' <span class="tab-n">' + famCount[f] + '</span></button>';
      }).join('');
      tabsEl.addEventListener('click', function (e) {
        var b = e.target.closest('.tab'); if (!b) return;
        state.fam = b.getAttribute('data-fam');
        tabsEl.querySelectorAll('.tab').forEach(function (t) { t.setAttribute('aria-pressed', t === b ? 'true' : 'false'); t.classList.toggle('is-active', t === b); });
        try { var u = new URL(location.href); if (state.fam === 'Todo') u.searchParams.delete('cat'); else u.searchParams.set('cat', state.fam); history.replaceState(null, '', u); } catch (err) {}
        render();
      });
    }
    if (input) {
      var wrap = input.closest('.search');
      if (wrap && !wrap.querySelector('svg')) wrap.insertAdjacentHTML('afterbegin', ICON.search);
      input.addEventListener('input', function () { state.q = norm(input.value); render(); });
    }
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-store]'); if (b) openStore(b.getAttribute('data-store'));
    });

    function render() {
      var shown = list.filter(function (s) {
        if (state.fam !== 'Todo' && familiaDe(s.cat) !== state.fam) return false;
        if (!state.q) return true;
        return norm(s.name).indexOf(state.q) > -1 || norm(s.cat).indexOf(state.q) > -1;
      });
      grid.innerHTML = shown.length ? shown.map(function (s) { return cardHTML(s, false); }).join('')
        : '<p class="dir-empty">No encontramos tiendas con esa búsqueda.</p>';
      if (countEl) countEl.innerHTML = '<strong>' + shown.length + '</strong> ' + (shown.length === 1 ? 'tienda' : 'tiendas');
    }
    render();

    var reqStore = qs('tienda');
    if (reqStore) setTimeout(function () { openStore(reqStore); }, 60);
  }

  /* ---------- Marcas destacadas (portada) ---------- */
  function initFeatured() {
    var grid = document.getElementById('featuredGrid');
    if (!grid) return;
    var max = parseInt(grid.getAttribute('data-max'), 10) || 12;
    var skip = (grid.getAttribute('data-skip') || '').split('|').map(norm).filter(Boolean);
    var withLogo = stores().filter(function (s) { return s && val(s.name) && val(s.logo) && skip.indexOf(norm(val(s.name))) < 0; });
    if (!withLogo.length) return;
    var pick = [], step = withLogo.length / Math.min(max, withLogo.length);
    for (var i = 0; i < Math.min(max, withLogo.length); i++) pick.push(withLogo[Math.floor(i * step)]);
    grid.innerHTML = pick.map(function (s) { return cardHTML(s, true); }).join('');
    var sec = grid.closest('[data-featured]'); if (sec) sec.hidden = false;
  }

  /* ---------- Eventos y promociones: lightbox ---------- */
  var lb, pubIdx = -1, pubFocus = null;
  function ensureLb() {
    if (lb) return lb;
    lb = document.createElement('div');
    lb.className = 'pub-lb'; lb.id = 'pubLb';
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-labelledby', 'pubLbTitle');
    lb.innerHTML = '<button type="button" class="pub-lb-close" aria-label="Cerrar">' + ICON.close + '</button>' +
      '<button type="button" class="pub-lb-prev" aria-label="Anterior">' + ICON.left + '</button>' +
      '<button type="button" class="pub-lb-next" aria-label="Siguiente">' + ICON.right + '</button>' +
      '<div class="pub-lb-box"><div class="pub-lb-img"><img alt=""></div><div class="pub-lb-text"><span class="pub-lb-tag"></span><h2 class="pub-lb-title" id="pubLbTitle"></h2><p class="pub-lb-desc"></p></div></div>';
    document.body.appendChild(lb);
    lb.addEventListener('click', function (e) { if (e.target === lb) closePub(); });
    lb.querySelector('.pub-lb-close').addEventListener('click', closePub);
    lb.querySelector('.pub-lb-prev').addEventListener('click', function () { pubStep(-1); });
    lb.querySelector('.pub-lb-next').addEventListener('click', function () { pubStep(1); });
    return lb;
  }
  function renderPub(title, tag, desc, img) {
    ensureLb();
    var im = lb.querySelector('.pub-lb-img img'); im.src = val(img); im.alt = val(title); lb.querySelector('.pub-lb-img').hidden = !val(img);
    var t = lb.querySelector('.pub-lb-tag'); t.textContent = val(tag); t.hidden = !val(tag);
    lb.querySelector('.pub-lb-title').textContent = val(title);
    var d = lb.querySelector('.pub-lb-desc'); d.textContent = val(desc); d.hidden = !val(desc);
    var many = events().length > 1;
    lb.querySelector('.pub-lb-prev').hidden = !many; lb.querySelector('.pub-lb-next').hidden = !many;
  }
  function openPub(title, tag, desc, img, ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    var list = events(); pubIdx = -1;
    for (var i = 0; i < list.length; i++) {
      if (val(list[i].title) === val(title) && (!img || val(list[i].img) === val(img))) { pubIdx = i; break; }
    }
    if (pubIdx < 0) for (var j = 0; j < list.length; j++) if (val(list[j].title) === val(title)) { pubIdx = j; break; }
    renderPub(title, tag, desc, img);
    if (!lb.classList.contains('is-open')) pubFocus = document.activeElement;
    lb.classList.add('is-open'); document.body.classList.add('no-scroll'); setInert(true, lb);
    lb.querySelector('.pub-lb-close').focus({ preventScroll: true });
  }
  function pubStep(d) {
    var list = events(); if (list.length < 2) return;
    pubIdx = ((pubIdx < 0 ? 0 : pubIdx) + d + list.length) % list.length;
    var e = list[pubIdx]; renderPub(e.title, e.tag, e.desc, e.img);
  }
  function closePub() {
    if (!lb || !lb.classList.contains('is-open')) return;
    lb.classList.remove('is-open'); setInert(false);
    if (!(modal && modal.classList.contains('is-open'))) document.body.classList.remove('no-scroll'); else setInert(true, modal);
    if (pubFocus && pubFocus.focus) pubFocus.focus({ preventScroll: true });
  }

  document.addEventListener('keydown', function (e) {
    if (lb && lb.classList.contains('is-open')) {
      if (e.key === 'Escape') closePub();
      else if (e.key === 'Tab') trapTab(e, lb);
      else if (e.key === 'ArrowLeft') pubStep(-1);
      else if (e.key === 'ArrowRight') pubStep(1);
    } else if (modal && modal.classList.contains('is-open')) {
      if (e.key === 'Escape') closeStore();
      else if (e.key === 'Tab') trapTab(e, modal.querySelector('.modal-box'));
      else if (e.key === 'ArrowLeft') showGal(gal.i - 1);
      else if (e.key === 'ArrowRight') showGal(gal.i + 1);
    }
  });

  /* ---------- API global ---------- */
  window.norm = norm;
  window.esc = esc;
  window.GIRO_FAMILIA = GIRO_FAMILIA;
  window.FAMILIAS = FAMILIAS;
  window.familiaDe = familiaDe;
  window.famClass = famClass;
  window.findStore = findStore;
  window.openStore = openStore;
  window.closeStore = closeStore;
  window.openPub = openPub;
  window.closePub = closePub;
  window.pubPrev = function () { pubStep(-1); };
  window.pubNext = function () { pubStep(1); };
  window.SiteUI = { ICON: ICON, slug: slug, qs: qs, stores: stores, events: events, logoHTML: logoHTML, cardHTML: cardHTML, telDigits: telDigits };

  function init() { initHeader(); initDirectory(); initFeatured(); initReveal(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
