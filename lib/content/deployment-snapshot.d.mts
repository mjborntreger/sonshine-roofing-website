export const SNAPSHOT_FILES: string[];
export function snapshotHash(value: string | Buffer): string;
export type DeploymentManifest = {
  version: number;
  clientSlug: string;
  digest: string;
  files: Record<string, string | null>;
};
export function verifyDeploymentSnapshot(root?: string): {
  manifest: DeploymentManifest;
  snapshots: Record<string, unknown>;
};
export function deploymentBundle(): ReturnType<typeof verifyDeploymentSnapshot>;
