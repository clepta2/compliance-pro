/**
 * worker.js — Cloudflare Worker Anycast para Compliance & PLD-FT Pro API
 * Screening de Sanções Internacionais (OFAC, ONU, UE), CEIS/CNEP (CGU) e PEP (COAF/BACEN).
 *
 * @license MIT
 */

import { CompliancePro } from './compliance-pro.js';

const SECURITY_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Ponte-Version': '3.0.0'
};

const ipBuckets = new Map();

function checkRateLimit(ipOrKey, limit = 60) {
  const now = Date.now();
  let b = ipBuckets.get(ipOrKey);
  if (!b || now > b.resetAt) {
    b = { count: 1, resetAt: now + 60000 };
    ipBuckets.set(ipOrKey, b);
    return { ok: true, remaining: limit - 1 };
  }
  b.count++;
  if (b.count > limit) return { ok: false, remaining: 0 };
  return { ok: true, remaining: limit - b.count };
}

function jsonResponse(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...SECURITY_HEADERS, ...extra }
  });
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: SECURITY_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    const ip = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const rl = checkRateLimit(ip, 120);

    if (!rl.ok && path !== '/health') {
      return jsonResponse({ ok: false, error: 'RATE_LIMIT_EXCEEDED' }, 429);
    }

    if (path === '/' || path === '/health' || path === '/status' || path === '/api/compliance/health') {
      return jsonResponse({
        ok: true,
        service: 'Compliance & PLD-FT Pro API',
        version: '1.0.0',
        status: 'online',
        listasMonitoradas: CompliancePro.LISTAS_MONITORADAS.length,
        rotas: [
          'GET /api/compliance/auditar?documento=...',
          'POST /api/compliance/auditar',
          'GET /api/compliance/listas'
        ]
      });
    }

    if (path === '/api/compliance/listas' || path === '/api/listas') {
      return jsonResponse({
        ok: true,
        total: CompliancePro.LISTAS_MONITORADAS.length,
        listas: CompliancePro.LISTAS_MONITORADAS
      });
    }

    if (path.startsWith('/api/compliance') || path === '/api/auditar') {
      let documento = url.searchParams.get('documento') || url.searchParams.get('cpf') || url.searchParams.get('cnpj') || '';
      let nome = url.searchParams.get('nome') || '';

      const matchDoc = path.match(/^\/api\/compliance\/(\d{11,14})$/);
      if (matchDoc) documento = matchDoc[1];

      if (request.method === 'POST') {
        try {
          const b = await request.json();
          documento = b.documento || b.cpf || b.cnpj || documento;
          nome = b.nome || nome;
        } catch (_) {}
      }

      const res = CompliancePro.auditarCompliance({ documento, nome });
      return jsonResponse(res, res.ok ? 200 : 400);
    }

    return jsonResponse({ ok: false, error: 'NOT_FOUND' }, 404);
  }
};
