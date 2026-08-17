export type SessionType = "morning" | "evening";
export type CurrencyType = "THB" | "MMK";

export interface BetItem {
  number: string; // 2-digit "00" to "99"
  amount: number;
  formula?: string;
  sourceText?: string;
}

export interface Slip {
  id: string;
  customerName: string;
  rawText: string;
  items: BetItem[];
  totalAmount: number;
  date: string; // YYYY-MM-DD
  session: SessionType;
  timestamp: string; // ISO string or time display
  commissionPercent?: number;
  notes?: string;
}

export interface NumberSummary {
  number: string; // "00" - "99"
  totalAmount: number;
  limit: number;
  heldAmount: number; // ဒိုင်ကိုင်ငွေ
  overLimitAmount: number; // ပိုငွေ / အပြင်လွှဲငွေ
  isOverLimit: boolean;
  slipCount: number;
  percentage: number;
}

export interface LimitSettings {
  currency: CurrencyType;
  defaultLimit: number; // e.g. 1000 Baht
  minBet: number; // e.g. 100 Baht
  maxBet: number; // e.g. 1000 Baht
  customLimits: Record<string, number>; // per-number custom limits
  multiplier: number; // e.g. 85 or 80 for winning payout (၁၀၀ လျှင် ၈၅၀၀)
  commissionRate: number; // e.g. 15% or 10%
}

export interface CashTransaction {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
  session: SessionType;
  timestamp: string;
}

export interface SettlementResult {
  winningNumber: string;
  winningBets: {
    customerName: string;
    slipId: string;
    amount: number;
    payout: number;
  }[];
  totalSales: number;
  totalHeldSales: number;
  totalOverLimitSales: number;
  totalPayout: number;
  commissionEarned: number;
  netProfit: number;
}

export interface ParseResult {
  items: BetItem[];
  totalAmount: number;
  overLimitItems: {
    number: string;
    existingAmount: number;
    addingAmount: number;
    newTotal: number;
    limit: number;
    overAmount: number;
  }[];
  unrecognizedLines: string[];
  formulaBreakdowns: { formula: string; count: number; subtotal: number }[];
}
