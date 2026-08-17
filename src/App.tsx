/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Slip, 
  LimitSettings, 
  CashTransaction, 
  SessionType, 
  CurrencyType, 
  BetItem 
} from "./types";
import { Header } from "./components/Header";
import { SlipEntrySection } from "./components/SlipEntrySection";
import { NumberMatrixGrid } from "./components/NumberMatrixGrid";
import { SlipsList } from "./components/SlipsList";
import { DailyLedgerTracker } from "./components/DailyLedgerTracker";
import { LimitSettingsModal } from "./components/LimitSettingsModal";
import { SettlementModal } from "./components/SettlementModal";

// Helper to get formatted today date
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Initial default settings
const DEFAULT_SETTINGS: LimitSettings = {
  currency: "THB",
  defaultLimit: 1000,
  minBet: 100,
  maxBet: 1000,
  multiplier: 85,
  commissionRate: 15,
  customLimits: {
    "19": 800,
    "91": 800,
    "45": 700,
  },
};

// Initial demo slips so the user immediately gets a live working experience
const SEED_SLIPS: Slip[] = [
  {
    id: "slip-demo-1",
    customerName: "ကိုအောင် (Viber)",
    rawText: "12,34,56-500\n7 ပတ် 200\nအပူး 300",
    items: [
      { number: "12", amount: 500 },
      { number: "34", amount: 500 },
      { number: "56", amount: 500 },
      { number: "07", amount: 200 },
      { number: "17", amount: 200 },
      { number: "27", amount: 200 },
      { number: "37", amount: 200 },
      { number: "47", amount: 200 },
      { number: "57", amount: 200 },
      { number: "67", amount: 200 },
      { number: "77", amount: 200 },
      { number: "87", amount: 200 },
      { number: "97", amount: 200 },
      { number: "70", amount: 200 },
      { number: "71", amount: 200 },
      { number: "72", amount: 200 },
      { number: "73", amount: 200 },
      { number: "74", amount: 200 },
      { number: "75", amount: 200 },
      { number: "76", amount: 200 },
      { number: "78", amount: 200 },
      { number: "79", amount: 200 },
      { number: "00", amount: 300 },
      { number: "11", amount: 300 },
      { number: "22", amount: 300 },
      { number: "33", amount: 300 },
      { number: "44", amount: 300 },
      { number: "55", amount: 300 },
      { number: "66", amount: 300 },
      { number: "88", amount: 300 },
      { number: "99", amount: 300 },
    ],
    totalAmount: 8300,
    date: getTodayDateString(),
    session: "morning",
    timestamp: "10:15 AM",
  },
  {
    id: "slip-demo-2",
    customerName: "မသူဇာ (Telegram)",
    rawText: "ခွေ 1234 300\n23 R 500\nနက္ခတ် 200",
    items: [
      { number: "12", amount: 300 },
      { number: "13", amount: 300 },
      { number: "14", amount: 300 },
      { number: "21", amount: 300 },
      { number: "23", amount: 800 },
      { number: "24", amount: 300 },
      { number: "31", amount: 300 },
      { number: "32", amount: 800 },
      { number: "34", amount: 300 },
      { number: "41", amount: 300 },
      { number: "42", amount: 300 },
      { number: "43", amount: 300 },
      { number: "07", amount: 200 },
      { number: "70", amount: 200 },
      { number: "18", amount: 200 },
      { number: "81", amount: 200 },
      { number: "35", amount: 200 },
      { number: "53", amount: 200 },
      { number: "46", amount: 200 },
      { number: "64", amount: 200 },
    ],
    totalAmount: 6600,
    date: getTodayDateString(),
    session: "morning",
    timestamp: "10:45 AM",
  },
];

export default function App() {
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());
  const [currentSession, setCurrentSession] = useState<SessionType>("morning");
  const [activeTab, setActiveTab] = useState<"entry" | "matrix" | "slips" | "ledger">("entry");

  // Load persistence
  const [settings, setSettings] = useState<LimitSettings>(() => {
    try {
      const saved = localStorage.getItem("2d_ledger_settings");
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [slips, setSlips] = useState<Slip[]>(() => {
    try {
      const saved = localStorage.getItem("2d_ledger_slips");
      return saved ? JSON.parse(saved) : SEED_SLIPS;
    } catch {
      return SEED_SLIPS;
    }
  });

  const [transactions, setTransactions] = useState<CashTransaction[]>(() => {
    try {
      const saved = localStorage.getItem("2d_ledger_transactions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("2d_ledger_settings", JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem("2d_ledger_slips", JSON.stringify(slips));
    } catch (e) {
      console.error(e);
    }
  }, [slips]);

  useEffect(() => {
    try {
      localStorage.setItem("2d_ledger_transactions", JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [transactions]);

  // Current session filtered slips
  const currentSessionSlips = slips.filter(
    (s) => s.date === currentDate && s.session === currentSession
  );

  // All day slips
  const allDaySlips = slips.filter((s) => s.date === currentDate);

  // Existing Number Totals for the current session (for Limit Checking)
  const existingNumberTotals = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const slip of currentSessionSlips) {
      for (const it of slip.items) {
        map[it.number] = (map[it.number] || 0) + it.amount;
      }
    }
    return map;
  }, [currentSessionSlips]);

  // Current Session Totals
  const sessionStats = React.useMemo(() => {
    let totalSales = 0;
    let totalHeld = 0;
    let totalOver = 0;

    for (let i = 0; i <= 99; i++) {
      const numStr = i < 10 ? `0${i}` : `${i}`;
      const totalOnNum = existingNumberTotals[numStr] || 0;
      const limit = settings.customLimits[numStr] || settings.defaultLimit;

      totalSales += totalOnNum;
      totalHeld += Math.min(totalOnNum, limit);
      totalOver += Math.max(0, totalOnNum - limit);
    }

    return {
      totalSales,
      totalHeld,
      totalOver,
      slipCount: currentSessionSlips.length,
    };
  }, [existingNumberTotals, settings, currentSessionSlips]);

  // Save new slip
  const handleSaveSlip = (slipData: {
    customerName: string;
    rawText: string;
    items: BetItem[];
    totalAmount: number;
    notes?: string;
  }) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newSlip: Slip = {
      id: `slip-${Date.now()}`,
      customerName: slipData.customerName,
      rawText: slipData.rawText,
      items: slipData.items,
      totalAmount: slipData.totalAmount,
      date: currentDate,
      session: currentSession,
      timestamp: timeStr,
      notes: slipData.notes,
    };

    setSlips((prev) => [newSlip, ...prev]);
  };

  // Delete slip
  const handleDeleteSlip = (slipId: string) => {
    setSlips((prev) => prev.filter((s) => s.id !== slipId));
  };

  // Add Cash Transaction
  const handleAddTransaction = (t: Omit<CashTransaction, "id" | "timestamp">) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newTrans: CashTransaction = {
      ...t,
      id: `trans-${Date.now()}`,
      timestamp: timeStr,
    };
    setTransactions((prev) => [newTrans, ...prev]);
  };

  // Delete Cash Transaction
  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950 flex flex-col">
      {/* Top Header */}
      <Header
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        currentSession={currentSession}
        onSessionChange={setCurrentSession}
        currency={settings.currency}
        onCurrencyChange={(curr) => setSettings((prev) => ({ ...prev, currency: curr }))}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSettlement={() => setIsSettlementOpen(true)}
        totalSales={sessionStats.totalSales}
        totalHeld={sessionStats.totalHeld}
        totalOver={sessionStats.totalOver}
        slipCount={sessionStats.slipCount}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {activeTab === "entry" && (
          <SlipEntrySection
            existingNumberTotals={existingNumberTotals}
            limitSettings={settings}
            onSaveSlip={handleSaveSlip}
            currency={settings.currency === "THB" ? "Baht" : "Ks"}
          />
        )}

        {activeTab === "matrix" && (
          <NumberMatrixGrid
            slips={currentSessionSlips}
            limitSettings={settings}
            currency={settings.currency === "THB" ? "Baht" : "Ks"}
          />
        )}

        {activeTab === "slips" && (
          <SlipsList
            slips={currentSessionSlips}
            onDeleteSlip={handleDeleteSlip}
            currency={settings.currency === "THB" ? "Baht" : "Ks"}
            session={currentSession}
            date={currentDate}
          />
        )}

        {activeTab === "ledger" && (
          <DailyLedgerTracker
            slips={currentSessionSlips}
            allDaySlips={allDaySlips}
            transactions={transactions.filter((t) => t.date === currentDate)}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            date={currentDate}
            currency={settings.currency === "THB" ? "Baht" : "Ks"}
            settings={settings}
          />
        )}
      </main>

      {/* Settings Modal */}
      <LimitSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />

      {/* Settlement Payout Modal */}
      <SettlementModal
        isOpen={isSettlementOpen}
        onClose={() => setIsSettlementOpen(false)}
        slips={currentSessionSlips}
        settings={settings}
        session={currentSession}
        date={currentDate}
        currency={settings.currency === "THB" ? "Baht" : "Ks"}
      />
    </div>
  );
}
