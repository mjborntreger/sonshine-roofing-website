export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { deploymentBundle } = await import('./lib/content/deployment-snapshot.mjs');
    deploymentBundle();
  }
}
