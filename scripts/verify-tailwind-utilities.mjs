import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOURCE_DIRECTORIES = ['app', 'components', 'lib'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);

const FORBIDDEN_UTILITIES = [
  { utility: 'text-md', replacement: 'text-base' },
  { utility: 'sm:4xl', replacement: 'sm:text-4xl' },
  { utility: 'rounded3xl', replacement: 'rounded-3xl' },
  { utility: 'hover:bg-white/18', replacement: 'hover:bg-white/[0.18]' },
  { utility: 'border-white/12', replacement: 'border-white/[0.12]' },
  { utility: 'bg-slate-950/72', replacement: 'bg-slate-950/[0.72]' },
  { utility: 'border-[#fb9216/5]', replacement: 'border-[#fb9216]/5' },
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

const forbiddenPatterns = FORBIDDEN_UTILITIES.map(({ utility, replacement }) => ({
  utility,
  replacement,
  pattern: new RegExp(
    `(?<![A-Za-z0-9_/-])${escapeRegExp(utility)}(?![A-Za-z0-9_/-])`,
    'gu',
  ),
}));

async function collectSourceFiles(relativeDirectory) {
  const absoluteDirectory = path.join(REPO_ROOT, relativeDirectory);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectSourceFiles(relativePath));
    } else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(relativePath);
    }
  }

  return files;
}

const sourceFiles = (await Promise.all(SOURCE_DIRECTORIES.map(collectSourceFiles)))
  .flat()
  .sort();
const failures = [];

for (const relativePath of sourceFiles) {
  const source = await readFile(path.join(REPO_ROOT, relativePath), 'utf8');

  for (const [lineIndex, line] of source.split(/\r?\n/u).entries()) {
    for (const { utility, replacement, pattern } of forbiddenPatterns) {
      for (const match of line.matchAll(pattern)) {
        failures.push({
          relativePath,
          line: lineIndex + 1,
          column: match.index + 1,
          utility,
          replacement,
        });
      }
    }
  }
}

if (failures.length > 0) {
  console.error('Unsupported Tailwind utilities found:');
  for (const failure of failures) {
    console.error(
      `${failure.relativePath}:${failure.line}:${failure.column} `
      + `${failure.utility} -> ${failure.replacement}`,
    );
  }
  process.exitCode = 1;
} else {
  console.log(`Tailwind utility verification passed (${sourceFiles.length} files checked).`);
}
