// Production-artifact test harness. This module is never loaded by deployment.
const fs = require('node:fs');
function deny() {
  if (process.env.CONTENT_NETWORK_AUDIT)
    fs.appendFileSync(process.env.CONTENT_NETWORK_AUDIT, 'unexpected outbound request\n');
  throw new Error('Runtime network access is forbidden in the deployment contract test');
}
globalThis.fetch = async () => deny();
for (const protocol of ['node:http', 'node:https']) {
  const transport = require(protocol);
  transport.request = deny;
  transport.get = deny;
}
