import { TriggerRule } from '../types/rule';
import { SimulatedAppState } from '../types/state';
import { ActionResult } from '../types/action';

export function simulateAction(
  rule: TriggerRule,
  appState: SimulatedAppState
): { newState: SimulatedAppState; result: ActionResult } {
  const state = structuredClone(appState);

  switch (rule.actionType) {
    case 'REDUCE_EXPOSURE': {
      const reductionPct = (rule.actionParams.reductionPct as number) ?? 0.2;
      const reduction = state.portfolio.activeETH * reductionPct;
      const before = { activeETH: state.portfolio.activeETH, protectedETH: state.portfolio.protectedETH };
      state.portfolio.activeETH = parseFloat((state.portfolio.activeETH - reduction).toFixed(4));
      state.portfolio.protectedETH = parseFloat((state.portfolio.protectedETH + reduction).toFixed(4));
      return {
        newState: state,
        result: {
          success: true,
          description: `Reduced exposure by ${(reductionPct * 100).toFixed(0)}%: moved ${reduction.toFixed(4)} ETH to protected`,
          before,
          after: { activeETH: state.portfolio.activeETH, protectedETH: state.portfolio.protectedETH },
        },
      };
    }

    case 'MARK_INVOICE_PAYABLE': {
      const before = { status: state.invoice.status };
      state.invoice.status = 'Payable';
      return {
        newState: state,
        result: {
          success: true,
          description: `Invoice marked as Payable`,
          before,
          after: { status: state.invoice.status },
        },
      };
    }

    case 'TRIGGER_WARNING': {
      const before = { status: state.collateral.status };
      state.collateral.status = 'Warning';
      return {
        newState: state,
        result: {
          success: true,
          description: `Collateral status set to Warning`,
          before,
          after: { status: state.collateral.status },
        },
      };
    }

    case 'UNLOCK_ESCROW': {
      const before = { status: state.escrow.status };
      state.escrow.status = 'Unlocked';
      return {
        newState: state,
        result: {
          success: true,
          description: `Escrow unlocked`,
          before,
          after: { status: state.escrow.status },
        },
      };
    }

    case 'EMIT_ALERT': {
      return {
        newState: state,
        result: {
          success: true,
          description: `Alert emitted: ${rule.actionParams.message ?? 'Rule condition met'}`,
          before: {},
          after: { alert: rule.actionParams.message ?? 'Rule condition met' },
        },
      };
    }

    default:
      return {
        newState: state,
        result: { success: false, description: 'Unknown action type', before: {}, after: {} },
      };
  }
}
