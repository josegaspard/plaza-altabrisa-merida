#!/usr/bin/env python3
"""Genera los datos en línea de las páginas y _design-data.json desde data/merida/.

Uso:  python3 tools/datos.py            (desde cualquier carpeta)
      DATA_DIR=/ruta/a/data/merida python3 tools/datos.py
      python3 tools/datos.py --check     (no escribe; sale con error si algo cambiaría)

Escribe, en UNA línea cada una:
  const STORES       -> index.html, directorio.html, mapa.html (y cualquier otra página que la tenga)
  const LOCAL_STORE  -> mapa.html
  const EVENTS       -> eventosypromociones.html
y además: texto «N tiendas» de [data-cc="tiendas"], _design-data.json,
logos que falten en images/locatarios/ y fotos que falten en images/tiendas/<slug>/N.jpg.

Criterios (los mismos que el motor: una fila por tienda):
  - num/loc = primer local de la tienda; las tiendas con varios locales los tienen todos en LOCAL_STORE.
  - LOCAL_STORE incluye los locales que el plano vivo no dibuja (solo salen en el listado del mapa).
"""
import json
import os
import re
import shutil
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.environ.get('DATA_DIR') or os.path.join(ROOT, '..', 'data', 'merida')
CHECK = '--check' in sys.argv

PAGES_STORES = ['index.html', 'directorio.html', 'mapa.html']
PAGES_STORES_OPC = ['eventosypromociones.html']
PISO_CLAVE = {'Planta Baja': 'pb', 'Planta Alta': 'pa'}


# --- Normalización idéntica a we_norm() del motor (engine.php) -----------------
_WE_MAP = {'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u', 'ä': 'a', 'ë': 'e',
           'ï': 'i', 'ö': 'o', 'â': 'a', 'ê': 'e', 'î': 'i', 'ô': 'o', 'û': 'u', 'ñ': 'n',
           '’': "'", '´': "'", '`': "'"}


def we_norm(t):
    t = t.strip(' \t\n\r\0\x0b').lower()          # trim() de PHP + mb_strtolower()
    t = ''.join(_WE_MAP.get(c, c) for c in t)       # strtr()
    return re.sub(r'[ \t\n\r\f\v]+', ' ', t)        # preg_replace('/\s+/') sin /u


def slug(t):
    t = t.lower().replace('´', '')
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def limpio(v):
    return v.strip() if isinstance(v, str) else ''


# --- Assets ---------------------------------------------------------------------
def asegura_logo(src_rel):
    """Copia el logo del gestor a images/locatarios/ si falta. Devuelve la ruta publicada."""
    if not src_rel:
        return ''
    nombre = os.path.basename(src_rel)
    destino = os.path.join(ROOT, 'images', 'locatarios', nombre)
    if not os.path.exists(destino):
        origen = os.path.join(DATA, src_rel)
        if not os.path.exists(origen) or CHECK:
            return '' if not os.path.exists(origen) else 'images/locatarios/' + nombre
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        shutil.copyfile(origen, destino)
    return 'images/locatarios/' + nombre


def asegura_fotos(nombre, fotos):
    """Fotos de la tienda en images/tiendas/<slug>/N.jpg (JPEG ≤1200 px, q78)."""
    carpeta = os.path.join(ROOT, 'images', 'tiendas', slug(nombre))
    out = []
    for i, rel in enumerate(fotos, 1):
        destino = os.path.join(carpeta, f'{i}.jpg')
        if not os.path.exists(destino):
            origen = os.path.join(DATA, rel)
            if not os.path.exists(origen):
                continue
            if not CHECK:
                from PIL import Image
                os.makedirs(carpeta, exist_ok=True)
                im = Image.open(origen)
                if im.mode != 'RGB':
                    fondo = Image.new('RGB', im.size, (255, 255, 255))
                    im = im.convert('RGBA')
                    fondo.paste(im, mask=im.split()[3])
                    im = fondo
                im.thumbnail((1200, 1200))
                im.save(destino, 'JPEG', quality=78, optimize=True, progressive=True)
        out.append(f'images/tiendas/{slug(nombre)}/{i}.jpg')
    return out


def optimiza_jpgs():
    """JPEG en CMYK o de más de 400 KB → RGB, ≤1200 px, q82. Devuelve cuántos tocó."""
    from PIL import Image
    n = 0
    for carpeta in ('images/locatarios', 'images/tiendas'):
        for raiz, _, archivos in os.walk(os.path.join(ROOT, carpeta)):
            for a in archivos:
                if not a.lower().endswith(('.jpg', '.jpeg')):
                    continue
                ruta = os.path.join(raiz, a)
                im = Image.open(ruta)
                if im.mode != 'CMYK' and os.path.getsize(ruta) <= 400 * 1024:
                    continue
                n += 1
                if CHECK:
                    continue
                im = im.convert('RGB')
                im.thumbnail((1200, 1200))
                im.save(ruta, 'JPEG', quality=82, optimize=True, progressive=True)
    return n


# --- Datos ------------------------------------------------------------------------
def construir_stores(src):
    stores = []
    for s in src:
        name = limpio(s.get('name'))
        ubic = s.get('ubicaciones') or [{'piso': s.get('piso'), 'local': s.get('local')}]
        imgs = asegura_fotos(name, s.get('fotos') or [])
        st = {
            'name': name,
            'cat': limpio(s.get('giro')),
            'img': imgs[0] if imgs else '',
            'logo': asegura_logo(s.get('logo')),
            'num': limpio(ubic[0].get('local')),
            'desc': limpio(s.get('descripcion')),
            'loc': limpio(ubic[0].get('piso')),
            'time': limpio(s.get('horario')),
            'ig': limpio(s.get('instagram')),
            'fb': limpio(s.get('facebook')),
            'web': limpio(s.get('web')),
            'tel': limpio(s.get('telefono')),
            'imgs': imgs,
        }
        stores.append({k: v for k, v in st.items() if v})
    return stores


def construir_local_store(mapa, nombre_por_id):
    out = {}
    for p in mapa['pisos']:
        locales = {}
        for l in p['locales']:
            # tienda del directorio; si no tiene ficha, el rótulo del gestor (p. ej. «PROXIMAMENTE») o null
            locales[str(l['local'])] = nombre_por_id.get(l.get('idCatLocatario')) or limpio(l.get('nombre')) or None
        out[PISO_CLAVE[p['piso']]] = locales
    return out


def construir_events(ev):
    events = []
    for e in ev.get('eventos') or []:
        events.append({k: v for k, v in {
            'title': limpio(e.get('titulo') or e.get('title')),
            'tag': limpio(e.get('etiqueta') or e.get('tag')),
            'desc': limpio(e.get('descripcion') or e.get('desc')),
            'img': limpio(e.get('img') or e.get('imagen')),
            'tab': limpio(e.get('tab')) or 'eventos',
        }.items() if v})
    return events


# --- Escritura --------------------------------------------------------------------
def js(v):
    return json.dumps(v, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


def poner_const(html, nombre, valor, obligatorio=True):
    patron = re.compile(r'^(\s*)const ' + nombre + r' = .*;[ \t]*$', re.M)
    if not patron.search(html):
        if obligatorio:
            sys.exit(f'Falta «const {nombre} = …;» en una página')
        return html
    return patron.sub(lambda m: m.group(1) + f'const {nombre} = {js(valor)};', html, count=1)


def editar(pagina, fn):
    ruta = os.path.join(ROOT, pagina)
    with open(ruta, encoding='utf-8') as f:
        html = f.read()
    nuevo = fn(html)
    if nuevo != html and not CHECK:
        with open(ruta, 'w', encoding='utf-8') as f:
            f.write(nuevo)
    return nuevo != html


def main():
    def carga(n):
        with open(os.path.join(DATA, n), encoding='utf-8') as f:
            return json.load(f)

    src, mapa, ev = carga('stores.json'), carga('mapa.json'), carga('eventos.json')
    stores = construir_stores(src)
    nombre_por_id = {s['idCatLocatario']: limpio(s['name']) for s in src}
    local_store = construir_local_store(mapa, nombre_por_id)
    events = construir_events(ev)

    nombres = {s['name'] for s in stores}
    rotulos = sorted({n for f in local_store.values() for n in f.values() if n and n not in nombres})
    if any(we_norm(r) != 'proximamente' for r in rotulos):
        sys.exit('LOCAL_STORE nombra tiendas que no están en STORES: ' + ', '.join(rotulos))

    tiendas = f'{len(stores)} tiendas'

    def con_tiendas(html):
        return re.sub(r'(data-cc="tiendas"[^>]*>)[^<]*(<)', lambda m: m.group(1) + tiendas + m.group(2), html)

    cambios = []
    for p in PAGES_STORES + PAGES_STORES_OPC:
        def fn(html, p=p):
            html = con_tiendas(poner_const(html, 'STORES', stores, p in PAGES_STORES))
            if p == 'mapa.html':
                html = poner_const(html, 'LOCAL_STORE', local_store)
            if p == 'eventosypromociones.html':
                html = poner_const(html, 'EVENTS', [{k: v for k, v in e.items() if k != 'tab'} for e in events])
            return html
        if editar(p, fn):
            cambios.append(p)

    design = {'stores': {}, 'pubs': {}}
    for s in stores:
        d = {k: s[k] for k in ('img', 'logo', 'ig', 'fb', 'web', 'imgs') if k in s}
        d['soon'] = False
        design['stores'][we_norm(s['name'])] = d
    for i, e in enumerate(events):
        design['pubs'][we_norm(e.get('title', ''))] = {
            'tag': '', 'img': e.get('img', ''), 'desc': e.get('desc', ''), 'alt': e.get('title', ''),
            'modalTitle': e.get('title', ''), 'modalTag': e.get('tag', ''), 'order': i,
            'tab': e.get('tab', 'eventos')}
    texto = json.dumps(design, ensure_ascii=False, indent=1) + '\n'
    ruta = os.path.join(ROOT, '_design-data.json')
    viejo = open(ruta, encoding='utf-8').read() if os.path.exists(ruta) else ''
    if texto != viejo:
        cambios.append('_design-data.json')
        if not CHECK:
            with open(ruta, 'w', encoding='utf-8') as f:
                f.write(texto)

    n_locales = sum(len(v) for v in local_store.values())
    n_ocupados = sum(1 for v in local_store.values() for n in v.values() if n)
    print(f'STORES {len(stores)} · LOCAL_STORE {n_locales} locales ({n_ocupados} con tienda) · '
          f'EVENTS {len(events)} · cambios: {", ".join(cambios) or "ninguno"}')
    if CHECK and cambios:
        sys.exit(1)


if __name__ == '__main__':
    main()
