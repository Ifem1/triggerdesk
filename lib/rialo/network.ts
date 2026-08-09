import deployment from '../../deployments/devnet.json';

export type NetworkName = 'devnet';

export type NetworkConfig = {
  name: NetworkName;
  chainId: 'rialo:devnet';
  rpcUrl: string;
  explorerUrl: null;
  cdkVersion: '0.12.2';
  scheduledTransfer: { programId: string; schemaVersion: number; artifactSha256: string };
  recurringAllowance: { programId: string; schemaVersion: number; artifactSha256: string };
};

const DEVNET: NetworkConfig = {
  name: 'devnet',
  chainId: 'rialo:devnet',
  rpcUrl: deployment.rpc,
  explorerUrl: null,
  cdkVersion: '0.12.2',
  scheduledTransfer: deployment.programs.scheduledTransferV1,
  recurringAllowance: deployment.programs.recurringAllowanceV1,
};

export function getNetworkConfig(value: string | undefined = process.env.NEXT_PUBLIC_RIALO_NETWORK): NetworkConfig {
  const name = value ?? 'devnet';
  if (name !== 'devnet') {
    throw new Error(`Unsupported Rialo network: ${name}`);
  }
  return DEVNET;
}

export const ACTIVE_NETWORK = getNetworkConfig();
