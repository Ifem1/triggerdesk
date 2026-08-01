export const SCHEDULED_TRANSFER_PROGRAM_ID = '7BcfcJEJPxatpejoHjbWfPNnEnEsnk3fh1toN4pYCuxh';
export const RECURRING_ALLOWANCE_PROGRAM_ID = '6TpMo9xFFLYktHhmXzaTkBp2rPTzAuLrk699W7NAW7RZ';

export const KELVIN_PER_RLO = 1_000_000_000;

export const DEVNET_RPC_URL = 'https://devnet.rialo.io:4101';

export const WORKFLOW_STATUS = {
  UNINITIALIZED: 0,
  PENDING: 1,
  CLAIMABLE: 2,
  CLAIMED: 3,
  CANCELLED: 4,
} as const;

export const WORKFLOW_STATUS_LABEL: Record<number, string> = {
  [WORKFLOW_STATUS.UNINITIALIZED]: 'Uninitialized',
  [WORKFLOW_STATUS.PENDING]: 'Pending',
  [WORKFLOW_STATUS.CLAIMABLE]: 'Claimable',
  [WORKFLOW_STATUS.CLAIMED]: 'Claimed',
  [WORKFLOW_STATUS.CANCELLED]: 'Cancelled',
};

export const ALLOWANCE_STATUS = {
  UNINITIALIZED: 0,
  ACTIVE: 1,
  COMPLETE: 2,
  CANCELLED: 3,
} as const;

export const ALLOWANCE_STATUS_LABEL: Record<number, string> = {
  [ALLOWANCE_STATUS.UNINITIALIZED]: 'Uninitialized',
  [ALLOWANCE_STATUS.ACTIVE]: 'Active',
  [ALLOWANCE_STATUS.COMPLETE]: 'Complete',
  [ALLOWANCE_STATUS.CANCELLED]: 'Cancelled',
};
