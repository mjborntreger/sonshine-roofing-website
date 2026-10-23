import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function validateAudit(audit, lock, policy, now = new Date()) {
  const fail = (message) => { throw new Error(message); };
  if (now >= new Date(`${policy.reviewBy}T00:00:00Z`)) fail('Accepted advisory requires a new review');
  if (audit.error || audit.auditReportVersion !== 2 || !audit.vulnerabilities || !audit.metadata?.vulnerabilities) fail('Invalid npm audit result');
  const names = Object.keys(audit.vulnerabilities);
  if (!names.length) {
    if (['info','low','moderate','high','critical','total'].some((key) => audit.metadata.vulnerabilities[key] !== 0)) fail('Audit severity/count mismatch');
    return { accepted: 0, message: 'No vulnerabilities reported; remove the obsolete exception after review.' };
  }
  if (JSON.stringify(names.sort()) !== JSON.stringify(Object.keys(policy.packages).sort())) fail('Vulnerability set changed');
  for (const [name, finding] of Object.entries(audit.vulnerabilities)) {
    const expected = policy.packages[name];
    if (finding.name !== name || finding.severity !== 'high' || !Array.isArray(finding.via) || !finding.via.length) fail(`Unexpected finding for ${name}`);
    if (JSON.stringify([...finding.nodes].sort()) !== JSON.stringify(Object.keys(expected.nodes).sort())) fail(`Audit installation paths changed for ${name}`);
    const via = finding.via.map((item) => typeof item === 'string' ? item : item.url).sort();
    if (JSON.stringify(via) !== JSON.stringify([...expected.via].sort())) fail(`Advisory or dependency chain changed for ${name}`);
    for (const item of finding.via) {
      if (typeof item !== 'string' && (item.name !== 'braces' || item.dependency !== 'braces' || item.severity !== 'high' || item.url !== policy.advisory)) fail('Unreviewed advisory detail');
    }
    const installed = Object.entries(lock.packages).filter(([path]) => path.endsWith(`/node_modules/${name}`) || path === `node_modules/${name}`).map(([path, pkg]) => [path, pkg.version]);
    if (installed.some(([path]) => !lock.packages[path].dev)) fail(`Dependency became a runtime input: ${name}`);
    if (JSON.stringify(Object.fromEntries(installed)) !== JSON.stringify(expected.nodes)) fail(`Installed versions or paths changed for ${name}`);
  }
  const edges = [];
  for (const [path, pkg] of Object.entries(lock.packages)) {
    for (const field of ['dependencies', 'devDependencies', 'optionalDependencies']) {
      for (const [name, range] of Object.entries(pkg[field] || {})) {
        if (policy.packages[name]) edges.push([path, field, name, range]);
      }
    }
  }
  if (JSON.stringify(edges.sort()) !== JSON.stringify([...policy.edges].sort())) fail('Dependency consumers changed');
  const counts = audit.metadata.vulnerabilities;
  if (counts.total !== names.length || counts.high !== names.length || ['info','low','moderate','critical'].some((key) => counts[key] !== 0)) fail('Audit severity/count mismatch');
  return { accepted: names.length, message: 'Accepted build-only braces chain remains unresolved; no supported fix is installed.' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const policy = JSON.parse(readFileSync('docs/accepted-advisories.json', 'utf8'));
    for (const [path, expected] of Object.entries(policy.boundaryFiles)) {
      if (createHash('sha256').update(readFileSync(path)).digest('hex') !== expected) throw new Error(`Review exposure boundary changes in ${path}`);
    }
    const result = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 120000 });
    if (result.error || ![0, 1].includes(result.status)) throw new Error('npm audit failed to complete');
    const report = validateAudit(JSON.parse(result.stdout), JSON.parse(readFileSync('package-lock.json','utf8')), policy);
    const runtime = spawnSync('npm', ['audit', '--omit=dev', '--json'], { encoding: 'utf8', timeout: 120000 });
    if (runtime.error || runtime.status !== 0 || JSON.parse(runtime.stdout).metadata?.vulnerabilities?.total !== 0) throw new Error('Runtime dependency audit is not clear');
    console.log(JSON.stringify(report));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
