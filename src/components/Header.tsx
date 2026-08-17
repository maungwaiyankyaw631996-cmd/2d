import React from "react";
import { SessionType, CurrencyType, LimitSettings } from "../types";
import { 
  Calendar, 
  Clock, 
  Sliders, 
  Trophy, 
  FileText, 
  Grid, 
  DollarSign, 
  RefreshCw, 
  AlertTriangle 
} from "lucide-react";

interface HeaderProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  currentSession: SessionType;
  onSessionChange: (session: SessionType) => void;
  currency: CurrencyType;
  onCurrencyChange: (curr: CurrencyType) => void;
  settings: LimitSettings;
  onOpenSettings: () => void;
  onOpenSettlement: () => void;
  onOpenAndroidInstall?: () => void;
  totalSales: number;
  totalHeld: number;
  totalOver: number;
  slipCount: number;
  activeTab: "entry" | "matrix" | "slips" | "ledger";
  onTabChange: (tab: "entry" | "matrix" | "slips" | "ledger") => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  currentSession,
  onSessionChange,
  currency,
  onCurrencyChange,
  settings,
  onOpenSettings,
  onOpenSettlement,
  onOpenAndroidInstall,
  totalSales,
  totalHeld,
  totalOver,
  slipCount,
  activeTab,
  onTabChange,
}) => {
  const currSymbol = currency === "THB" ? "฿" : "Ks";

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center font-black text-xl text-slate-950 shadow-md">
            2D
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-white">
                ၂လုံးဒိုင် စာရင်းကိုင် & Limit မန်နေဂျာ
              </h1>
              <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full font-medium border border-amber-500/30">
                PRO ဒိုင်စနစ်
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Auto Parser • Over-Limit Alerts • OCR & Voice
            </p>
          </div>
        </div>

        {/* Date & Session Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700 text-sm">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input
              type="date"
              id="ledger-date-picker"
              value={currentDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-slate-200 text-xs sm:text-sm focus:outline-none cursor-pointer"
            />
          </div>

          {/* Session Switcher: Morning / Evening */}
          <div className="inline-flex rounded-lg p-0.5 bg-slate-800 border border-slate-700">
            <button
              id="session-morning-btn"
              onClick={() => onSessionChange("morning")}
              className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                currentSession === "morning"
                  ? "bg-amber-500 text-slate-950 shadow font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              မနက် (12:01)
            </button>
            <button
              id="session-evening-btn"
              onClick={() => onSessionChange("evening")}
              className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                currentSession === "evening"
                  ? "bg-indigo-600 text-white shadow font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              ညနေ (4:30)
            </button>
          </div>

          {/* Currency Switcher */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
            <button
              id="curr-thb-btn"
              onClick={() => onCurrencyChange("THB")}
              className={`px-2 py-1 text-xs font-semibold rounded ${
                currency === "THB"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ฿ Baht
            </button>
            <button
              id="curr-mmk-btn"
              onClick={() => onCurrencyChange("MMK")}
              className={`px-2 py-1 text-xs font-semibold rounded ${
                currency === "MMK"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Ks ကျပ်
            </button>
          </div>

          {/* Winning Settlement Button */}
          <button
            id="open-settlement-btn"
            onClick={onOpenSettlement}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs sm:text-sm shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            ပေါက်ဂဏန်း စစ်မည်
          </button>

          {/* Android App Install Button */}
          {onOpenAndroidInstall && (
            <button
              id="open-android-install-btn"
              onClick={onOpenAndroidInstall}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
              title="Android App အဖြစ် ထည့်သွင်းရန်"
            >
              <span className="text-base leading-none">📱</span>
              <span className="hidden sm:inline">Android App</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
            title="Limit & System Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          {/* Summary Badges */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">စုစုပေါင်း ရောင်းရငွေ:</span>
              <span className="font-bold text-emerald-400 text-base">
                {totalSales.toLocaleString()} {currSymbol}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">ဒိုင်ကိုင်ငွေ (Held):</span>
              <span className="font-bold text-sky-400 text-base">
                {totalHeld.toLocaleString()} {currSymbol}
              </span>
            </div>

            {totalOver > 0 && (
              <div className="flex items-center gap-1.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 px-2 py-0.5 rounded-md animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-medium">ပိုငွေ / အပြင်လွှဲ:</span>
                <span className="font-bold text-rose-400">
                  {totalOver.toLocaleString()} {currSymbol}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">စလစ်အရေအတွက်:</span>
              <span className="font-semibold text-slate-200">
                {slipCount} စောင်
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-slate-400">
              <span>Limit သတ်မှတ်ချက်:</span>
              <span className="text-amber-400 font-semibold">
                {settings.minBet.toLocaleString()} - {settings.defaultLimit.toLocaleString()} {currSymbol}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <button
              id="tab-entry-btn"
              onClick={() => onTabChange("entry")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "entry"
                  ? "bg-emerald-600 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              စလစ်တင်ရန်
            </button>
            <button
              id="tab-matrix-btn"
              onClick={() => onTabChange("matrix")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "matrix"
                  ? "bg-emerald-600 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              ဂဏန်းကွက် (00-99)
            </button>
            <button
              id="tab-slips-btn"
              onClick={() => onTabChange("slips")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "slips"
                  ? "bg-emerald-600 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              စလစ်စာရင်း ({slipCount})
            </button>
            <button
              id="tab-ledger-btn"
              onClick={() => onTabChange("ledger")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "ledger"
                  ? "bg-emerald-600 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              နေ့စဉ် စာရင်းချုပ်
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
