import { TriggerRule } from '../types/rule';
import { SimulatedAppState } from '../types/state';
import { generateId } from '../utils/ids';

export function seedRules(): TriggerRule[] {
  return [
    {
      id: generateId('rule'),
      ownerId: 'demo-user',
      name: 'ETH Price Protection',
      ruleType: 'PRICE',
      inputKey: 'ETH_USD',
      predicate: 'LESS_THAN',
      threshold: 3000,
      actionType: 'REDUCE_EXPOSURE',
      actionParams: { reductionPct: 0.2 },
      status: 'WAITING',
      createdAt: new Date().toISOString(),
      simulatedSignature: '0xSIM_' + Math.random().toString(16).slice(2, 18),
    },
    {
      id: generateId('rule'),
      ownerId: 'demo-user',
      name: 'Invoice Due Date',
      ruleType: 'INVOICE',
      inputKey: 'INVOICE_DUE_DATE',
      predicate: 'DATE_REACHED',
      threshold: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      actionType: 'MARK_INVOICE_PAYABLE',
      actionParams: {},
      status: 'WAITING',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId('rule'),
      ownerId: 'demo-user',
      name: 'Collateral Warning',
      ruleType: 'COLLATERAL',
      inputKey: 'COLLATERAL_RATIO',
      predicate: 'RATIO_BELOW',
      threshold: 130,
      actionType: 'TRIGGER_WARNING',
      actionParams: {},
      status: 'WAITING',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId('rule'),
      ownerId: 'demo-user',
      name: 'Escrow Release',
      ruleType: 'ESCROW',
      inputKey: 'DELIVERY_STATUS',
      predicate: 'EQUALS',
      threshold: 'confirmed',
      actionType: 'UNLOCK_ESCROW',
      actionParams: {},
      status: 'WAITING',
      createdAt: new Date().toISOString(),
    },
  ];
}

export function seedAppState(): SimulatedAppState {
  return {
    portfolio: { activeETH: 10, protectedETH: 0 },
    invoice: {
      id: 'INV-001',
      description: 'Services rendered - Q2 2026',
      amount: 15000,
      status: 'Pending',
      dueDate: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    collateral: {
      ratio: 128,
      status: 'Healthy',
      collateralValue: 128000,
      debtValue: 100000,
    },
    escrow: {
      id: 'ESC-001',
      description: 'Product delivery escrow',
      amount: 5000,
      status: 'Locked',
      deliveryStatus: 'Confirmed',
    },
  };
}
