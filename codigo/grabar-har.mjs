// Graba una sesión real contra la app (app.mjs) y la escribe como HAR 1.2,
// el formato que come `rea environment-build`. No usa navegador: hace las
// peticiones con fetch y registra cada par petición/respuesta.
//
//   node grabar-har.mjs <base_url> <salida.har>
import { writeFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:3100';
const SALIDA = process.argv[3] ?? 'sesion.har';
const entries = [];

async function pedir(metodo, ruta, cuerpo) {
  const url = BASE + ruta;
  const inicio = new Date();
  const t0 = performance.now();
  const opciones = { method: metodo, headers: { accept: 'application/json' } };
  if (cuerpo !== undefined) {
    opciones.headers['content-type'] = 'application/json';
    opciones.body = JSON.stringify(cuerpo);
  }
  const res = await fetch(url, opciones);
  const texto = await res.text();
  const ms = performance.now() - t0;
  const cabe = (h) => [...Object.entries(h)].map(([name, value]) => ({ name, value: String(value) }));
  const u = new URL(url);
  entries.push({
    startedDateTime: inicio.toISOString(),
    time: ms,
    request: {
      method: metodo,
      url,
      httpVersion: 'HTTP/1.1',
      headers: cabe(opciones.headers),
      queryString: [...u.searchParams].map(([name, value]) => ({ name, value })),
      cookies: [],
      headersSize: -1,
      bodySize: opciones.body ? Buffer.byteLength(opciones.body) : 0,
      ...(opciones.body ? { postData: { mimeType: 'application/json', text: opciones.body } } : {}),
    },
    response: {
      status: res.status,
      statusText: res.statusText,
      httpVersion: 'HTTP/1.1',
      headers: cabe(Object.fromEntries(res.headers)),
      cookies: [],
      content: { size: Buffer.byteLength(texto), mimeType: res.headers.get('content-type') ?? 'application/json', text: texto },
      redirectURL: '',
      headersSize: -1,
      bodySize: Buffer.byteLength(texto),
    },
    cache: {},
    timings: { send: 0, wait: ms, receive: 0 },
  });
  console.log(`${metodo} ${ruta} -> ${res.status} ${texto.slice(0, 80)}`);
}

// Un recorrido que cubre listar, crear, renombrar y borrar.
await pedir('POST', '/api/reset');
await pedir('GET', '/api/folders');
await pedir('POST', '/api/folders', { nombre: 'Impuestos' });
await pedir('GET', '/api/folders');
await pedir('PATCH', '/api/folders/1', { nombre: 'Proyectos 2026' });
await pedir('DELETE', '/api/folders/3');
await pedir('GET', '/api/folders');

const har = {
  log: {
    version: '1.2',
    creator: { name: 'grabar-har.mjs', version: '1.0' },
    entries,
  },
};
writeFileSync(SALIDA, JSON.stringify(har, null, 2), 'utf-8');
console.log(`\nHAR escrito: ${SALIDA} (${entries.length} peticiones)`);
