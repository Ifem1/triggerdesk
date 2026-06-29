export interface PortfolioState {
  activeETH: number;
  protectedETH: number;
}

export interface InvoiceState {
  id: string;
  description: string;
  amount: number;
  status: 'Pending' | 'Payable' | 'Paid';
  dueDate: string;
}

export interface CollateralState {
  ratio: number;
  status: 'Healthy' | 'Warning' | 'Critical';
  collateralValue: number;
  debtValue: number;
}

export interface EscrowState {
  id: string;
  description: string;
  amount: number;
  status: 'Locked' | 'Unlocked' | 'Released';
  deliveryStatus: 'Pending' | 'Confirmed';
}

export interface SimulatedAppState {
  portfolio: PortfolioState;
  invoice: InvoiceState;
  collateral: CollateralState;
  escrow: EscrowState;
}
