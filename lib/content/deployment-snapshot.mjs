import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export const SNAPSHOT_FILES = [
  'projects.json',
  'locations.json',
  'static-media.json',
  'editorial.json',
];
export const snapshotHash = (value) => createHash('sha256').update(value).digest('hex');
const fail = () => {
  throw new Error(
    'Deployment content bundle is missing, corrupt, or incompatible. Run a successful credentialed build.',
  );
};

/** Validate the complete bundle, including publication artifacts, before serving. */
export function verifyDeploymentSnapshot(root = process.cwd()) {
  try {
    const manifest = JSON.parse(
      readFileSync(join(root, '.generated/content-manifest.json'), 'utf8'),
    );
    if (
      manifest.version !== 1 ||
      manifest.clientSlug !== 'sonshine-roofing' ||
      manifest.digest !== snapshotHash(JSON.stringify(manifest.files))
    )
      fail();
    const expected = [
      ...SNAPSHOT_FILES.map((name) => `.generated/${name}`),
      'public/__sitemaps/static-routes.json',
      'public/llms.txt',
    ];
    if (JSON.stringify(Object.keys(manifest.files).sort()) !== JSON.stringify(expected.sort()))
      fail();
    for (const [file, digest] of Object.entries(manifest.files)) {
      const filename = join(root, file);
      if (digest === null && file === 'public/llms.txt') {
        if (existsSync(filename)) fail();
        continue;
      }
      if (typeof digest !== 'string' || snapshotHash(readFileSync(filename)) !== digest) fail();
    }
    const snapshots = Object.fromEntries(
      SNAPSHOT_FILES.map((name) => [
        name,
        JSON.parse(readFileSync(join(root, '.generated', name), 'utf8')),
      ]),
    );
    if (Object.values(snapshots).some((value) => value.clientSlug !== manifest.clientSlug)) fail();
    if (
      snapshots['projects.json'].version !== 2 ||
      snapshots['locations.json'].version !== 1 ||
      snapshots['static-media.json'].version !== 1 ||
      snapshots['editorial.json'].version !== 1
    )
      fail();
    const editorial = snapshots['editorial.json'];
    if (
      ![
        'posts',
        'topics',
        'persons',
        'glossary',
        'websitePages',
        'offers',
        'sponsors',
        'reviews',
        'redirects',
        'legacyMediaRedirects',
        'routeOwners',
      ].every((key) => Array.isArray(editorial[key])) ||
      !editorial.legalCopy?.privacyPolicyHtml ||
      !editorial.legalCopy?.termsOfUseHtml ||
      !editorial.reviewsCarousel ||
      !editorial.buildSettings?.contentSecurityPolicy ||
      !editorial.assetOrigin
    )
      fail();
    if (
      snapshots['locations.json'].projectSnapshotHash !==
      snapshotHash(JSON.stringify(snapshots['projects.json']))
    )
      fail();
    return { manifest, snapshots };
  } catch {
    return fail();
  }
}

let bundle;
export function deploymentBundle() {
  return (bundle ??= verifyDeploymentSnapshot());
}
