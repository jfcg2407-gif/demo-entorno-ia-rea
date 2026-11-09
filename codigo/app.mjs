// App web de demostración para REA: un gestor de carpetas en memoria.
// API REST: listar, crear, renombrar y borrar carpetas. Sirve también una
// página mínima. Todo local (127.0.0.1), datos de prueba. Node 18+.
//
//   node app.mjs [puerto]        (por defecto 3100)
import { createServer } from 'node:http';

const PUERTO = Number(process.argv[2] ?? 3100);
let secuencia = 1;
const carpetas = new Map();
function sembrar() {
  carpetas.clear();
  secuencia = 1;
  for (const nombre of ['Proyectos', 'Clientes', 'Facturas']) {
    const id = secuencia++;
    carpetas.set(id, { id, nombre });
  }
}
sembrar();

function enviar(res, codigo, cuerpo) {
  const texto = JSON.stringify(cuerpo);
  res.writeHead(codigo, { 'content-type': 'application/json; charset=utf-8' });
  res.end(texto);
}
async function leerCuerpo(req) {
  let datos = '';
  for await (const trozo of req) datos += trozo;
  return datos ? JSON.parse(datos) : {};
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PUERTO}`);
  const partes = url.pathname.split('/').filter(Boolean); // ['api','folders',':id?']
  try {
    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end('<!doctype html><meta charset="utf-8"><title>Carpetas</title>' +
        '<h1>Gestor de carpetas (demo REA)</h1><p>API en <code>/api/folders</code></p>');
      return;
    }
    if (partes[0] === 'api' && partes[1] === 'folders') {
      // /api/folders
      if (partes.length === 2) {
        if (req.method === 'GET') return enviar(res, 200, { folders: [...carpetas.values()] });
        if (req.method === 'POST') {
          const { nombre } = await leerCuerpo(req);
          if (!nombre) return enviar(res, 400, { error: 'falta nombre' });
          const id = secuencia++;
          const carpeta = { id, nombre };
          carpetas.set(id, carpeta);
          return enviar(res, 201, { folder: carpeta });
        }
      }
      // /api/folders/:id
      if (partes.length === 3) {
        const id = Number(partes[2]);
        if (!carpetas.has(id)) return enviar(res, 404, { error: 'no existe' });
        if (req.method === 'PATCH') {
          const { nombre } = await leerCuerpo(req);
          const carpeta = carpetas.get(id);
          carpeta.nombre = nombre ?? carpeta.nombre;
          return enviar(res, 200, { folder: carpeta });
        }
        if (req.method === 'DELETE') {
          carpetas.delete(id);
          return enviar(res, 200, { ok: true, id });
        }
      }
    }
    if (req.method === 'POST' && url.pathname === '/api/reset') {
      sembrar();
      return enviar(res, 200, { ok: true });
    }
    enviar(res, 404, { error: 'ruta no encontrada' });
  } catch (e) {
    enviar(res, 500, { error: String(e?.message ?? e) });
  }
});

server.listen(PUERTO, '127.0.0.1', () => {
  console.log(`LISTO http://127.0.0.1:${PUERTO}`);
});
