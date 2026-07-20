import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function runScript(filename) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(new URL(filename, import.meta.url))], {
      stdio: 'inherit',
      env: process.env,
    });

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `${filename} failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}.`,
        ),
      );
    });
  });
}

await runScript('./make-static-sitemap.mjs');
await runScript('./generate-llms-txt.mjs');
