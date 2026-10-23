import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { validateAudit } from './audit-policy.mjs';
const policy = JSON.parse(readFileSync('docs/accepted-advisories.json','utf8'));
const lock = JSON.parse(readFileSync('package-lock.json','utf8'));
const now = new Date('2026-10-22T12:00:00Z');
const fixture = { auditReportVersion: 2, metadata: { vulnerabilities: {info:0,low:0,moderate:0,high:4,critical:0,total:4} }, vulnerabilities: Object.fromEntries(Object.entries(policy.packages).map(([name, value]) => [name, { name, severity:'high', nodes:Object.keys(value.nodes), via:value.via.map((via) => via.startsWith('https:') ? { name:'braces', dependency:'braces', url:via, severity:'high' } : via) }])) };
test('current accepted advisory remains explicit', () => assert.equal(validateAudit(fixture, lock, policy, now).accepted, 4));
for (const [name, mutate] of [
 ['new advisory', (a) => a.vulnerabilities.braces.via.push({url:'https://github.com/advisories/new',name:'braces',dependency:'braces',severity:'high'})],
 ['different installed path', (a) => a.vulnerabilities.braces.nodes.push('node_modules/new/node_modules/braces')],
 ['critical severity', (a) => {a.vulnerabilities.braces.severity='critical';}],
 ['audit outage', (a) => {a.error={message:'service unavailable'};}]
]) test(`rejects ${name}`, () => {const changed=structuredClone(fixture); mutate(changed); assert.throws(() => validateAudit(changed,lock,policy,now));});
test('rejects a new consumer', () => { const changed=structuredClone(lock); changed.packages['node_modules/new']={version:'1.0.0',dependencies:{braces:'^3.0.3'}};assert.throws(() => validateAudit(fixture,changed,policy,now));});
test('rejects changed installed versions', () => {const changed=structuredClone(lock); changed.packages['node_modules/braces'].version='3.0.4';assert.throws(() => validateAudit(fixture,changed,policy,now));});
test('expires for review', () => assert.throws(() => validateAudit(fixture,lock,policy,new Date('2026-11-22T00:00:00Z'))));

test('rejects runtime exposure', () => { const changed=structuredClone(lock); delete changed.packages['node_modules/braces'].dev; assert.throws(() => validateAudit(fixture,changed,policy,now)); });

test('rejects an unrelated high advisory', () => { const changed=structuredClone(fixture); changed.vulnerabilities.unrelated={name:'unrelated',severity:'high',nodes:['node_modules/unrelated'],via:[{url:'https://github.com/advisories/unrelated'}]}; changed.metadata.vulnerabilities.high++; changed.metadata.vulnerabilities.total++; assert.throws(() => validateAudit(changed,lock,policy,now)); });

test('rejects contradictory clean-report counts', () => {const changed=structuredClone(fixture); changed.vulnerabilities={}; assert.throws(() => validateAudit(changed,lock,policy,now));});
test('accepts a consistent clean report for exception removal review', () => {const changed=structuredClone(fixture); changed.vulnerabilities={}; for(const key of Object.keys(changed.metadata.vulnerabilities)) changed.metadata.vulnerabilities[key]=0; assert.equal(validateAudit(changed,lock,policy,now).accepted,0);});
