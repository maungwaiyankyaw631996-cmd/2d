import React, { useState } from "react";
import { Slip, LimitSettings } from "../types";
import { 
  FORMULA_PRESETS, 
  generateRound, 
  generateHead, 
  generateTail, 
  formatOverLimitSlipForExport 
} from "../utils/parser2d";
import { 
  Grid, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  Copy, 
  CheckCircle2, 
  Filter, 
  Eye, 
  X 
} from "lucide-react";

interface NumberMatrixGridProps {
  slips: Slip[];
  limitSettings: LimitSettings;
  currency: string;
}

export const NumberMatrixGrid: React.FC<NumberMatrixGridProps> = ({
  slips,
  limitSettings,
  currency,
}) => {
  const [filterMode, setFilterMode] = useState<"all" | "active" | "over" | "near">("all");
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Aggregate bets on all 00-99
  const numberStats = React.useMemo(() => {
    const map: Record<
      string,
      {
        total: number;
        slips: { customerName: string; amount: number; slipId: string; timestamp: string }[];
      }
    > = {};

    // Initialize 00 to 99
    for (let i = 0; i <= 99; i++) {
      const numStr = i < 10 ? `0${i}` : `${i}`;
      map[numStr] = { total: 0, slips: [] };
    }

    // Accumulate from active slips
    for (const slip of slips) {
      for (const item of slip.items) {
        if (map[item.number]) {
          map[item.number].total += item.amount;
          map[item.number].slips.push({
            customerName: slip.customerName || "အထွေထွေ",
            amount: item.amount,
            slipId: slip.id,
            timestamp: slip.timestamp,
          });
        }
      }
    }

    return map;
  }, [slips]);

  // Overall calculations
  const allNumbers = Array.from({ length: 100 }, (_, i) => (i < 10 ? `0${i}` : `${i}`));

  const overLimitNumbers = allNumbers.filter((n) => {
    const limit = limitSettings.customLimits[n] || limitSettings.defaultLimit;
    return numberStats[n].total > limit;
  });

  const activeNumbers = allNumbers.filter((n) => numberStats[n].total > 0);

  const nearLimitNumbers = allNumbers.filter((n) => {
    const limit = limitSettings.customLimits[n] || limitSettings.defaultLimit;
    const tot = numberStats[n].total;
    return tot > 0 && tot >= limit * 0.75 && tot <= limit;
  });

  // Filtered display list
  const displayNumbers = allNumbers.filter((num) => {
    if (searchQuery.trim()) {
      return num.includes(searchQuery.trim());
    }
    if (filterMode === "active") return numberStats[num].total > 0;
    if (filterMode === "over") {
      const limit = limitSettings.customLimits[num] || limitSettings.defaultLimit;
      return numberStats[num].total > limit;
    }
    if (filterMode === "near") {
      const limit = limitSettings.customLimits[num] || limitSettings.defaultLimit;
      const tot = numberStats[num].total;
      return tot > 0 && tot >= limit * 0.75 && tot <= limit;
    }
    return true;
  });

  // Copy over-limit list to clipboard
  const handleCopyOverLimits = () => {
    const overItems = overLimitNumbers.map((n) => {
      const limit = limitSettings.customLimits[n] || limitSettings.defaultLimit;
      return {
        number: n,
        overAmount: numberStats[n].total - limit,
      };
    });

    if (overItems.length === 0) {
      showToast("❌ Limit ကျော်လွန်နေသော ဂဏန်းမရှိပါ");
      return;
    }

    const text = formatOverLimitSlipForExport(overItems, "Limit ကျော်ငွေ အပြင်လွှဲစာရင်း");
    navigator.clipboard.writeText(text);
    showToast("📋 Limit ကျော်လွန်သော ဂဏန်းများ ကော်ပီကူးယူပြီးပါပြီ!");
  };

  // Copy all active bets summary
  const handleCopyAllActiveBets = () => {
    const lines = activeNumbers.map((n) => `${n} = ${numberStats[n].total}`);
    const text = `=== 2D စုစုပေါင်း ထိုးကြေးစာရင်း ===\n${lines.join("\n")}`;
    navigator.clipboard.writeText(text);
    showToast("📋 စုစုပေါင်း ထိုးကြေးစာရင်း ကော်ပီကူးယူပြီးပါပြီ!");
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-emerald-500/50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Control Bar & Filters */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            စစ်ထုတ်ရန်:
          </div>

          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterMode === "all"
                ? "bg-slate-700 text-white font-semibold"
                : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
            }`}
          >
            အားလုံး (100 ကွက်)
          </button>

          <button
            onClick={() => setFilterMode("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filterMode === "active"
                ? "bg-emerald-600 text-white font-semibold"
                : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
            }`}
          >
            ထိုးကြေးရှိသော ဂဏန်းများ ({activeNumbers.length})
          </button>

          <button
            onClick={() => setFilterMode("over")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filterMode === "over"
                ? "bg-rose-600 text-white font-semibold"
                : "bg-slate-800/80 text-rose-400 hover:bg-rose-950/40"
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Limit ကျော်များ ({overLimitNumbers.length})
          </button>

          <button
            onClick={() => setFilterMode("near")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterMode === "near"
                ? "bg-amber-600 text-white font-semibold"
                : "bg-slate-800/80 text-amber-400 hover:bg-amber-950/40"
            }`}
          >
            Limit နီးကပ် (&gt;75%) ({nearLimitNumbers.length})
          </button>
        </div>

        {/* Search & Copy Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ဂဏန်းရှာရန် (00-99)..."
              maxLength={2}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={handleCopyOverLimits}
            className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Limit ကျော်လွန်သော ဂဏန်းများ ကော်ပီယူရန်"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ပိုငွေ</span> ကော်ပီ
          </button>

          <button
            onClick={handleCopyAllActiveBets}
            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="ထိုးကြေးရှိသော ဂဏန်းအားလုံး ကော်ပီယူရန်"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">စာရင်းအားလုံး</span> ကော်ပီ
          </button>
        </div>
      </div>

      {/* 10x10 Matrix Grid Board */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-xs">
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700 inline-block" />
              မထိုးရသေး (၀)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-500/50 inline-block" />
              ပုံမှန် (&lt;75%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-950 border border-amber-500/60 inline-block" />
              သတိပေး (&ge;75%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-950 border border-rose-500 inline-block" />
              Limit ကျော် (&gt;100%)
            </span>
          </div>

          <span className="text-slate-400">
            ပြသထားသော ကွက်အရေအတွက်: <strong className="text-white">{displayNumbers.length}</strong>
          </span>
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5">
          {displayNumbers.map((num) => {
            const stat = numberStats[num];
            const limit = limitSettings.customLimits[num] || limitSettings.defaultLimit;
            const total = stat.total;
            const isOver = total > limit;
            const percent = limit > 0 ? (total / limit) * 100 : 0;
            const isNear = total > 0 && percent >= 75 && !isOver;
            const hasBet = total > 0;

            let cardBg = "bg-slate-950/60 border-slate-800 hover:border-slate-600 text-slate-400";
            if (isOver) {
              cardBg =
                "bg-rose-950/70 border-rose-500 text-rose-200 shadow-md shadow-rose-950/50 animate-pulse ring-1 ring-rose-500";
            } else if (isNear) {
              cardBg = "bg-amber-950/50 border-amber-500/60 text-amber-200";
            } else if (hasBet) {
              cardBg = "bg-emerald-950/40 border-emerald-500/40 text-emerald-200";
            }

            return (
              <button
                key={num}
                id={`grid-cell-${num}`}
                onClick={() => setSelectedNumber(num)}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-between transition-all hover:scale-105 active:scale-95 text-left cursor-pointer min-h-[72px] relative group ${cardBg}`}
              >
                {/* 2D Number */}
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono font-black text-base text-white">
                    {num}
                  </span>
                  {isOver && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </div>

                {/* Amount */}
                <div className="w-full text-right mt-1">
                  {hasBet ? (
                    <span
                      className={`text-xs font-mono font-bold block truncate ${
                        isOver
                          ? "text-rose-300"
                          : isNear
                          ? "text-amber-300"
                          : "text-emerald-400"
                      }`}
                    >
                      {total.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-600">-</span>
                  )}
                </div>

                {/* Progress bar towards limit */}
                {hasBet && (
                  <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOver
                          ? "bg-rose-500"
                          : isNear
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Number Detail Modal / Drawer */}
      {selectedNumber && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-amber-500 flex items-center justify-center font-mono font-black text-2xl text-slate-950">
                  {selectedNumber}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">
                    ဂဏန်း ({selectedNumber}) ၏ အသေးစိတ် စာရင်း
                  </h3>
                  <span className="text-xs text-slate-400">
                    Limit သတ်မှတ်ချက်: {limitSettings.customLimits[selectedNumber] || limitSettings.defaultLimit} {currency}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedNumber(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total breakdown */}
            {(() => {
              const stat = numberStats[selectedNumber];
              const limit = limitSettings.customLimits[selectedNumber] || limitSettings.defaultLimit;
              const total = stat.total;
              const isOver = total > limit;
              const held = Math.min(total, limit);
              const over = Math.max(0, total - limit);

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400">စုစုပေါင်း</span>
                      <div className="text-base font-bold text-white mt-1">
                        {total.toLocaleString()} {currency}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400">ဒိုင်ကိုင်ငွေ</span>
                      <div className="text-base font-bold text-emerald-400 mt-1">
                        {held.toLocaleString()} {currency}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400">ပိုငွေ/အပြင်လွှဲ</span>
                      <div className={`text-base font-bold mt-1 ${over > 0 ? "text-rose-400" : "text-slate-500"}`}>
                        {over.toLocaleString()} {currency}
                      </div>
                    </div>
                  </div>

                  {/* Customer Slips List */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 mb-2">
                      ထိုးထားသော ကာစတမ်မာ စာရင်းများ ({stat.slips.length} ကြိမ်):
                    </h4>

                    {stat.slips.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
                        ဤဂဏန်းကို မည်သူမျှ မထိုးရသေးပါ
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {stat.slips.map((s, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div>
                              <strong className="text-white">{s.customerName}</strong>
                              <span className="text-[10px] text-slate-500 ml-2">{s.timestamp}</span>
                            </div>
                            <span className="font-mono font-bold text-emerald-400">
                              {s.amount.toLocaleString()} {currency}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedNumber(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-xl text-xs transition-colors"
              >
                ပိတ်မည်
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
