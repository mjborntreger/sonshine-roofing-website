import { deploymentBundle } from './deployment-snapshot.mjs';

export function getDirectusBuildSettings() {
  return deploymentBundle().snapshots['editorial.json'].buildSettings;
}
