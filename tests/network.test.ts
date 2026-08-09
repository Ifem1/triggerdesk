import deployment from '../deployments/devnet.json';
import { getNetworkConfig } from '../lib/rialo/network';

describe('Rialo network registry', () => {
  test('uses the verified DevNet deployment registry', () => {
    const config = getNetworkConfig('devnet');
    expect(config.chainId).toBe('rialo:devnet');
    expect(config.scheduledTransfer.programId).toBe(deployment.programs.scheduledTransferV1.programId);
    expect(config.scheduledTransfer.artifactSha256).toBe(deployment.programs.scheduledTransferV1.artifactSha256);
    expect(config.recurringAllowance.programId).toBe(deployment.programs.recurringAllowanceV1.programId);
  });

  test('fails closed for unverified networks', () => {
    expect(() => getNetworkConfig('mainnet')).toThrow(/Unsupported/);
  });
});
