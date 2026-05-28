'use strict';

const http = require('node:http');
const https = require('node:https');
const tls = require('node:tls');
const zlib = require('node:zlib');

const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
const shouldProxyFetch = process.env.CODEX_NETWORK_PROXY_ACTIVE === '1' && proxyUrl;

if (shouldProxyFetch && typeof fetch === 'function') {
  const nativeFetch = globalThis.fetch;
  const proxy = new URL(proxyUrl);

  globalThis.fetch = async function codexProxyFetch(input, init = {}) {
    const request = input instanceof Request ? input : null;
    const target = new URL(request ? request.url : input);

    if (!['http:', 'https:'].includes(target.protocol) || isNoProxyHost(target.hostname)) {
      return nativeFetch(input, init);
    }

    return requestThroughProxy(proxy, target, request, init, 0);
  };
}

function isNoProxyHost(hostname) {
  const noProxy = process.env.NO_PROXY || process.env.no_proxy || '';
  const host = hostname.toLowerCase();

  return noProxy
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .some((entry) => {
      if (entry === '*') return true;
      if (entry === host) return true;
      if (entry.startsWith('.')) return host.endsWith(entry);
      return false;
    });
}

async function requestThroughProxy(proxy, target, request, init, redirectCount) {
  if (redirectCount > 20) throw new TypeError('fetch failed: too many redirects');

  const method = init.method || request?.method || 'GET';
  const headers = mergeHeaders(request?.headers, init.headers);
  const body = await normalizeBody(init.body);

  if (body && !headers.has('content-length')) headers.set('content-length', String(body.length));

  const response = await makeProxyRequest(proxy, target, method, headers, body);
  const redirectMode = init.redirect || request?.redirect || 'follow';

  if (redirectMode === 'follow' && response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (location) {
      const nextTarget = new URL(location, target);
      return requestThroughProxy(proxy, nextTarget, request, { ...init, body }, redirectCount + 1);
    }
  }

  return response;
}

function mergeHeaders(requestHeaders, initHeaders) {
  const headers = new Headers(requestHeaders || undefined);
  const extra = new Headers(initHeaders || undefined);

  for (const [key, value] of extra) headers.set(key, value);
  return headers;
}

async function normalizeBody(body) {
  if (body == null) return null;
  if (Buffer.isBuffer(body)) return body;
  if (typeof body === 'string') return Buffer.from(body);
  if (body instanceof URLSearchParams) return Buffer.from(body.toString());
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  if (ArrayBuffer.isView(body)) return Buffer.from(body.buffer, body.byteOffset, body.byteLength);

  throw new TypeError('Codex proxy fetch only supports string, Buffer, ArrayBuffer, and URLSearchParams bodies');
}

function makeProxyRequest(proxy, target, method, headers, body) {
  return target.protocol === 'https:'
    ? makeHttpsProxyRequest(proxy, target, method, headers, body)
    : makeHttpProxyRequest(proxy, target, method, headers, body);
}

function makeHttpProxyRequest(proxy, target, method, headers, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: proxy.hostname,
      port: proxy.port || 80,
      method,
      path: target.href,
      headers: headersToObject(headers, target),
    }, (res) => {
      collectResponse(res).then(resolve, reject);
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function makeHttpsProxyRequest(proxy, target, method, headers, body) {
  const targetPort = target.port || 443;

  return new Promise((resolve, reject) => {
    const connect = http.request({
      host: proxy.hostname,
      port: proxy.port || 80,
      method: 'CONNECT',
      path: `${target.hostname}:${targetPort}`,
      headers: { Host: `${target.hostname}:${targetPort}` },
    });

    connect.on('connect', (res, socket) => {
      if (res.statusCode !== 200) {
        socket.destroy();
        reject(new TypeError(`fetch failed: proxy CONNECT returned ${res.statusCode}`));
        return;
      }

      const secureSocket = tls.connect({
        socket,
        servername: target.hostname,
        ALPNProtocols: ['http/1.1'],
      });

      secureSocket.once('secureConnect', () => {
        const req = https.request({
          host: target.hostname,
          port: targetPort,
          method,
          path: `${target.pathname}${target.search}`,
          headers: headersToObject(headers, target),
          createConnection: () => secureSocket,
        }, (response) => {
          collectResponse(response).then(resolve, reject);
        });

        req.on('error', reject);
        if (body) req.write(body);
        req.end();
      });

      secureSocket.on('error', reject);
    });

    connect.on('error', reject);
    connect.end();
  });
}

function headersToObject(headers, target) {
  const result = { Host: target.host };
  for (const [key, value] of headers) result[key] = value;
  return result;
}

function collectResponse(response) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    response.on('data', (chunk) => chunks.push(chunk));
    response.on('error', reject);
    response.on('end', () => {
      try {
        const headers = new Headers(response.headers);
        let body = Buffer.concat(chunks);
        const encoding = headers.get('content-encoding');

        if (encoding === 'gzip') body = zlib.gunzipSync(body);
        if (encoding === 'deflate') body = zlib.inflateSync(body);
        if (encoding === 'br') body = zlib.brotliDecompressSync(body);

        if (encoding) {
          headers.delete('content-encoding');
          headers.delete('content-length');
        }

        resolve(new Response(body, {
          status: response.statusCode,
          statusText: response.statusMessage,
          headers,
        }));
      } catch (error) {
        reject(error);
      }
    });
  });
}
