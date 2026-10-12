import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AgentError, MAX_REQUEST_BYTES, createBedrockTransport, getConfiguration, runAgent, validateRequest } from './lib/agent.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

function headers(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'");
}

function json(res, status, body) {
  if (res.destroyed || res.writableEnded) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export function isLocalRequest(req) {
  const host = req.headers.host;
  if (typeof host !== 'string' || !/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/iu.test(host)) return false;
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  const origin = req.headers.origin;
  if (!origin) return true; // Native tools have no Origin; browsers must match exactly.
  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'http:' && parsed.host.toLowerCase() === host.toLowerCase() && parsed.origin === origin;
  } catch { return false; }
}

function readJson(req) {
  const contentType = req.headers['content-type']?.split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') return Promise.reject(new AgentError('CONTENT_TYPE', 'Envía la solicitud como application/json.', 415));
  const declaredLength = Number(req.headers['content-length'] || 0);
  if (!Number.isFinite(declaredLength) || declaredLength > MAX_REQUEST_BYTES) return Promise.reject(new AgentError('BODY_TOO_LARGE', 'El texto es demasiado grande. Divide el historial en partes.', 413));
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    let bytes = 0;
    let finished = false;
    const timer = setTimeout(() => finish(new AgentError('BODY_TIMEOUT', 'La solicitud tardó demasiado en llegar.', 408)), 10000);
    function finish(error, body) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      req.removeListener('data', onData);
      req.removeListener('end', onEnd);
      req.removeListener('error', onError);
      req.removeListener('aborted', onAbort);
      if (error) { req.resume(); reject(error); }
      else resolveBody(body);
    }
    function onData(chunk) {
      bytes += chunk.length;
      if (bytes > MAX_REQUEST_BYTES) return finish(new AgentError('BODY_TOO_LARGE', 'El texto es demasiado grande. Divide el historial en partes.', 413));
      chunks.push(chunk);
    }
    function onEnd() {
      try { finish(null, JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { finish(new AgentError('INVALID_JSON', 'La solicitud no contiene JSON válido.', 400)); }
    }
    function onError() { finish(new AgentError('REQUEST_ERROR', 'No se pudo leer la solicitud.', 400)); }
    function onAbort() { finish(new AgentError('REQUEST_ABORTED', 'La solicitud se interrumpió.', 400)); }
    req.on('data', onData);
    req.on('end', onEnd);
    req.on('error', onError);
    req.on('aborted', onAbort);
  });
}

async function serveAsset(req, res, pathname, distPath) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); }
  catch { throw new AgentError('BAD_PATH', 'Dirección inválida.', 400); }
  if (decoded.includes('\0') || decoded.includes('\\') || decoded.split('/').some(part => part.startsWith('.'))) throw new AgentError('BAD_PATH', 'Archivo no disponible.', 404);
  let base;
  try { base = await realpath(distPath); }
  catch { throw new AgentError('BUILD_REQUIRED', 'La interfaz aún no está compilada. Ejecuta npm run build o abre el servidor de desarrollo.', 503); }
  let candidate = resolve(base, `.${decoded === '/' ? '/index.html' : decoded}`);
  if (!candidate.startsWith(base + sep)) throw new AgentError('BAD_PATH', 'Archivo no disponible.', 404);
  try {
    candidate = await realpath(candidate);
  } catch {
    if (extname(decoded)) throw new AgentError('NOT_FOUND', 'Archivo no encontrado.', 404);
    candidate = await realpath(resolve(base, 'index.html'));
  }
  if (!candidate.startsWith(base + sep) || !MIME[extname(candidate)]) throw new AgentError('NOT_FOUND', 'Archivo no encontrado.', 404);
  const info = await stat(candidate);
  if (!info.isFile() || info.size > 10 * 1024 * 1024) throw new AgentError('NOT_FOUND', 'Archivo no encontrado.', 404);
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[extname(candidate)]);
  res.setHeader('Content-Length', info.size);
  res.end(req.method === 'HEAD' ? undefined : await readFile(candidate));
}

export function createAppServer({ transport: suppliedTransport, configuration, distPath = resolve(ROOT, 'dist'), agentTimeoutMs = 90000 } = {}) {
  let transportPromise;
  let active = false;
  const recentCalls = [];
  const config = () => configuration ? Promise.resolve(configuration) : getConfiguration();
  async function getTransport(settings) {
    if (suppliedTransport) return suppliedTransport;
    if (!transportPromise) transportPromise = createBedrockTransport({ region: settings.region }).catch(error => { transportPromise = undefined; throw error; });
    return transportPromise;
  }
  const server = createServer(async (req, res) => {
    headers(res);
    try {
      if (!isLocalRequest(req)) throw new AgentError('ORIGIN_REJECTED', 'Abre MOCHILA desde su dirección local para continuar.', 403);
      const pathname = new URL(req.url, 'http://localhost').pathname;
      if (pathname === '/api/status' && req.method === 'GET') {
        const settings = await config();
        return json(res, 200, { configured: Boolean(settings.configured), region: settings.region, model: settings.model });
      }
      if (pathname === '/api/plan' && req.method === 'POST') {
        const body = await readJson(req);
        validateRequest(body);
        const settings = await config();
        if (!settings.configured) throw new AgentError('NOT_CONFIGURED', 'Conecta AWS Bedrock para analizar tus propios mensajes. La demo sigue disponible.', 503);
        const now = Date.now();
        while (recentCalls.length && recentCalls[0] < now - 60000) recentCalls.shift();
        if (active || recentCalls.length >= 6) {
          res.setHeader('Retry-After', '15');
          throw new AgentError('BUSY', 'Ya hay una tarjeta en preparación. Espera un momento antes de intentarlo otra vez.', 429);
        }
        active = true;
        recentCalls.push(now);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), agentTimeoutMs);
        const disconnect = () => { if (!res.writableEnded) controller.abort(); };
        res.once('close', disconnect);
        try {
          const transport = await getTransport(settings);
          const result = await runAgent(body, { transport, model: settings.model, signal: controller.signal });
          return json(res, 200, result);
        } finally {
          clearTimeout(timer);
          res.removeListener('close', disconnect);
          active = false;
        }
      }
      if (pathname.startsWith('/api/')) throw new AgentError('NOT_FOUND', 'Ruta no disponible.', 404);
      if (!['GET', 'HEAD'].includes(req.method)) throw new AgentError('METHOD_NOT_ALLOWED', 'Método no disponible.', 405);
      await serveAsset(req, res, pathname, distPath);
    } catch (error) {
      const safe = error instanceof AgentError ? error : new AgentError('SERVER_ERROR', 'No se pudo completar la solicitud. Inténtalo de nuevo.', 500);
      if (safe.status === 413 || safe.status === 408) res.setHeader('Connection', 'close');
      json(res, safe.status, { error: safe.message, code: safe.code });
    }
  });
  server.requestTimeout = 100000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
  server.maxHeadersCount = 40;
  server.on('close', () => { transportPromise?.then(transport => transport.close?.()).catch(() => {}); });
  return server;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.env.PORT || 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('PORT debe ser un número entre 1 y 65535.');
    process.exitCode = 1;
  } else {
    const server = createAppServer();
    server.once('error', () => { console.error('No se pudo abrir MOCHILA. Revisa si el puerto ya está ocupado.'); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log(`MOCHILA disponible en http://127.0.0.1:${port}`));
  }
}
