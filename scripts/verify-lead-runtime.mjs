import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
export async function verifyLeadRuntime(root = process.cwd()) {
  const scratch = await mkdtemp(join(tmpdir(), 'sonshine-leads-'));
  const runtime = join(scratch, 'app');
  await cp(join(root, '.next/standalone'), runtime, { recursive: true, filter: (p) => !basename(p).startsWith('.env') });
  await cp(join(root, 'public'), join(runtime, 'public'), { recursive: true });
  await mkdir(join(runtime, '.next'), { recursive: true });
  await cp(join(root, '.next/static'), join(runtime, '.next/static'), { recursive: true });
  await cp(join(root, '.generated'), join(runtime, '.generated'), { recursive: true });
  const received = [];
  let rejectDelivery = false;
  const receiver = createServer(async (req, res) => {
    let text = ''; for await (const part of req) text += part;
    received.push({ headers: req.headers, payload: JSON.parse(text) });
    res.writeHead(rejectDelivery ? 503 : 200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: !rejectDelivery }));
  });
  await new Promise((done) => receiver.listen(0, '127.0.0.1', done));
  const destination = `http://127.0.0.1:${receiver.address().port}`;
  const payload = {
    version: 'v2', formType: 'contact-lead', sri_lead_id: 'sri_synthetic-maintenance',
    submittedAt: '2026-10-22T12:00:00Z',
    source: { page: '/contact-us', gclid: 'synthetic-click', utm_source: 'fixture', utm_campaign: 'maintenance' },
    contact: { firstName: 'Synthetic', lastName: 'Fixture', email: 'synthetic@example.com', phone: '9415550100' },
    smsConsent: { projectSms: 'no', marketingSms: 'yes' },
    details: { projectType: 'roof-replacement' }, antiSpam: { cfToken: 'XXXX.DUMMY.TOKEN.XXXX' },
  };
  let child;
  async function stop() {
    if (!child || child.exitCode !== null) return;
    const closed = new Promise((done) => child.once('exit', done)); child.kill('SIGTERM'); await closed;
  }
  try {
    for (const mode of ['pass', 'fail', 'spent']) {
      const listener = createServer(); await new Promise((done) => listener.listen(0, '127.0.0.1', done));
      const port = listener.address().port; await new Promise((done) => listener.close(done));
      const secret = `${{ pass: 1, fail: 2, spent: 3 }[mode]}x0000000000000000000000000000000AA`;
      const env = {
        PATH: process.env.PATH, NODE_ENV: 'production', NEXT_PUBLIC_ENV: 'production',
        NEXT_PUBLIC_BASE_URL: 'https://example.test', NEXT_PUBLIC_SITE_URL: 'https://example.test',
        HOSTNAME: '127.0.0.1', PORT: String(port), ALLOWED_ORIGIN: 'https://example.test',
        N8N_WEBHOOK_URL: destination, N8N_WEBHOOK_SECRET: 'synthetic-receiver-only', TURNSTILE_SECRET_KEY: secret,
        LEAD_RUNTIME_FIXTURE: '1', TURNSTILE_LIVE_TEST: process.env.TURNSTILE_LIVE_TEST === '1' ? '1' : '0',
        NODE_OPTIONS: `--require ${resolve(root, 'scripts/fixtures/lead-network.cjs')}`,
      };
      child = spawn(process.execPath, ['server.js'], { cwd: runtime, env, stdio: ['ignore', 'pipe', 'pipe'] });
      // Drain without retaining possible transport errors/payloads.
      child.stdout.resume(); child.stderr.resume();
      const base = `http://127.0.0.1:${port}`;
      let ready = false;
      for (let n = 0; n < 100; n++) {
        if (child.exitCode !== null) throw new Error('Isolated lead server exited');
        try { if ((await fetch(base + '/robots.txt')).ok) { ready = true; break; } } catch { /* starting */ }
        await sleep(100);
      }
      assert.ok(ready, 'Isolated lead server ready');
      const send = (body = payload, origin = 'https://example.test') => fetch(base + '/api/lead', {
        method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify(body),
      });
      const before = received.length;
      assert.equal((await send(payload, 'https://untrusted.example')).status, 403);
      assert.equal((await send({ ...payload, antiSpam: { ...payload.antiSpam, hp_field: 'robot' } })).status, 200);
      assert.equal((await send({ ...payload, smsConsent: { projectSms: '', marketingSms: 'no' } })).status, 400);
      assert.equal(received.length, before, 'Rejected and honeypot submissions never reach the receiver');
      const response = await send();
      assert.equal(response.status, mode === 'pass' ? 200 : 400, `CAPTCHA ${mode}`);
      if (mode === 'pass') {
        const forwarded = received.at(-1);
        assert.equal(forwarded.headers['x-ss-secret'], 'synthetic-receiver-only');
        assert.equal(forwarded.payload.lead_source, 'google_ads');
        assert.equal(forwarded.payload.source.utm_campaign, 'maintenance');
        assert.equal(forwarded.payload.smsConsent.projectSms, 'no');
        assert.equal(forwarded.payload.smsConsent.marketingSms, 'yes');
        assert.equal(forwarded.payload.smsConsent.disclosureVersion, 'sms-consent-v1');
        assert.equal(forwarded.payload.sri_lead_id, payload.sri_lead_id);
        rejectDelivery = true; assert.equal((await send()).status, 503);
        rejectDelivery = false; assert.equal((await send()).status, 200);
        assert.equal(received.at(-1).payload.sri_lead_id, payload.sri_lead_id, 'Retry preserves downstream idempotency identity');
      } else {
        assert.equal(received.length, before);
        if (mode === 'spent') assert.match((await response.json()).error, /timeout-or-duplicate/);
      }
      await stop();
    }
    console.log(`Production lead runtime passed CAPTCHA pass/fail/spent, retry, honeypot, origin, validation, SMS choices, attribution and payload checks (${process.env.TURNSTILE_LIVE_TEST === '1' ? 'Cloudflare public test keys' : 'isolated provider fixture'}).`);
  } finally {
    await stop(); await new Promise((done) => receiver.close(done)); await rm(scratch, { recursive: true, force: true });
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await verifyLeadRuntime();
