import React, { useState } from "react";
import { Slip, LimitSettings } from "../types";
import { Trophy, X, Copy, CheckCircle2, AlertCircle, DollarSign, Calculator } from "lucide-react";

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  slips: Slip[];
  settings: LimitSettings;
  session: "morning" | "evening";
  date: string;
  currency: string;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  isOpen,
  onClose,
  slips,
  settings,
  session,
  date,
  currency,
}) => {
  const [winningNumber, setWinningNumber] = useState("");
  const [multiplier, setMultiplier] = useState(settings.multiplier || 85);
  const [commissionRate, setCommissionRate] = useState(settings.commissionRate || 15);
  const [copiedToast, setCopiedToast] = useState(false);

  // Sync with settings props when settings change
  React.useEffect(() => {
    if (settings.multiplier) setMultiplier(settings.multiplier);
    if (settings.commissionRate !== undefined) setCommissionRate(settings.commissionRate);
  }, [settings]);

  const cleanWinNum = winningNumber.trim();
  const isValidWinNum = /^\d{2}$/.test(cleanWinNum);

  // Calculate settlement (called unconditionally at top level)
  const calculation = React.useMemo(() => {
    let totalSales = 0;
    const winningHits: {
      customerName: string;
      amount: number;
      payout: number;
      slipId: string;
      timestamp: string;
    }[] = [];

    let totalWinningBetAmount = 0;

    for (const slip of slips) {
      totalSales += slip.totalAmount;

      if (isValidWinNum) {
        for (const item of slip.items) {
          if (item.number === cleanWinNum) {
            const payout = item.amount * multiplier;
            totalWinningBetAmount += item.amount;
            winningHits.push({
              customerName: slip.customerName || "အထွေထွေ",
              amount: item.amount,
              payout,
              slipId: slip.id,
              timestamp: slip.timestamp,
            });
          }
        }
      }
    }

    const totalPayout = totalWinningBetAmount * multiplier;
    const commission = (totalSales * commissionRate) / 100;
    const netSalesAfterCommission = totalSales - commission;
    const netProfit = netSalesAfterCommission - totalPayout;

    return {
      totalSales,
      winningHits,
      totalWinningBetAmount,
      totalPayout,
      commission,
      netSalesAfterCommission,
      netProfit,
    };
  }, [slips, cleanWinNum, isValidWinNum, multiplier, commissionRate]);

  if (!isOpen) return null;

  // Copy Settlement Result Text for Viber/Messenger
  const handleCopyReceipt = () => {
    if (!isValidWinNum) return;

    const sessionLabel = session === "morning" ? "မနက် (12:01 PM)" : "ညနေ (4:30 PM)";
    let report = `🏆 === 2D ပေါက်ဂဏန်းနှင့် စာရင်းရှင်းတမ်း ===\n`;
    report += `📅 နေ့စွဲ: ${date} (${sessionLabel})\n`;
    report += `🎯 ပေါက်ဂဏန်း: [ ${cleanWinNum} ] (${multiplier}ဆ)\n`;
    report += `--------------------------------\n`;
    report += `💰 စုစုပေါင်း အရောင်း: ${calculation.totalSales.toLocaleString()} ${currency}\n`;
    report += `💵 ကော်မရှင် (${commissionRate}%): ${calculation.commission.toLocaleString()} ${currency}\n`;
    report += `🏷️ ပေါက်ကြေး စုစုပေါင်း: ${calculation.totalWinningBetAmount.toLocaleString()} ${currency}\n`;
    report += `💸 စုစုပေါင်း လျော်ကြေး: ${calculation.totalPayout.toLocaleString()} ${currency}\n`;
    report += `--------------------------------\n`;
    if (calculation.netProfit >= 0) {
      report += `✨ ဒိုင် အသားတင် အမြတ်: +${calculation.netProfit.toLocaleString()} ${currency}\n`;
    } else {
      report += `⚠️ ဒိုင် အသားတင် အရှုံး: ${calculation.netProfit.toLocaleString()} ${currency}\n`;
    }
    report += `--------------------------------\n`;
    report += `👥 ပေါက်သူများ စာရင်း:\n`;
    if (calculation.winningHits.length === 0) {
      report += `(ပေါက်သူ မရှိပါ)\n`;
    } else {
      calculation.winningHits.forEach((w, i) => {
        report += `${i + 1}. ${w.customerName} : ${w.amount} x ${multiplier} = ${w.payout.toLocaleString()} ${currency}\n`;
      });
    }

    navigator.clipboard.writeText(report);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                ၂လုံးထီ ပေါက်ဂဏန်း စစ်ဆေးခြင်း & အလျော်အစား တွက်ချက်မှု
              </h3>
              <p className="text-xs text-slate-400">
                {date} ({session === "morning" ? "မနက်ပိုင်း 12:01 PM" : "ညနေပိုင်း 4:30 PM"})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Bar */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1">
                ပေါက်ဂဏန်း ထည့်ပါ (00-99)
              </label>
              <input
                type="text"
                id="winning-number-input"
                maxLength={2}
                placeholder="ဥပမာ- 45"
                value={winningNumber}
                onChange={(e) => setWinningNumber(e.target.value)}
                className="w-full bg-slate-900 border-2 border-amber-500/80 rounded-xl px-3 py-2 text-center text-xl font-mono font-black text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                အဆ (Multiplier)
              </label>
              <input
                type="number"
                value={multiplier}
                onChange={(e) => setMultiplier(parseInt(e.target.value, 10) || 85)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ကော်မရှင် %
              </label>
              <input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Settlement Summary Cards */}
        {isValidWinNum ? (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">စုစုပေါင်း အရောင်း</span>
                <span className="font-bold text-white text-sm font-mono mt-1 block">
                  {calculation.totalSales.toLocaleString()} {currency}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">ကော်မရှင် ({commissionRate}%)</span>
                <span className="font-bold text-indigo-400 text-sm font-mono mt-1 block">
                  {calculation.commission.toLocaleString()} {currency}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">စုစုပေါင်း လျော်ကြေး</span>
                <span className="font-bold text-rose-400 text-sm font-mono mt-1 block">
                  {calculation.totalPayout.toLocaleString()} {currency}
                </span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  calculation.netProfit >= 0
                    ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                    : "bg-rose-950/60 border-rose-500/50 text-rose-300"
                }`}
              >
                <span className="block text-[11px] opacity-80">
                  {calculation.netProfit >= 0 ? "ဒိုင်အမြတ် (Profit)" : "ဒိုင်အရှုံး (Loss)"}
                </span>
                <span className="font-black text-base font-mono mt-1 block">
                  {calculation.netProfit >= 0 ? "+" : ""}
                  {calculation.netProfit.toLocaleString()} {currency}
                </span>
              </div>
            </div>

            {/* Winners List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  ပေါက်သူများ စာရင်း ({calculation.winningHits.length} ဦး):
                </h4>
                <span className="text-xs text-amber-400 font-mono font-bold">
                  ပေါက်ကြေးစုစုပေါင်း: {calculation.totalWinningBetAmount.toLocaleString()} {currency}
                </span>
              </div>

              {calculation.winningHits.length === 0 ? (
                <div className="text-center py-6 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs">
                  ဤပေါက်ဂဏန်း ({cleanWinNum}) အား မည်သည့် ထိုးသားမှ မပေါက်ပါ (ဒိုင်စားပါသည်)
                </div>
              ) : (
                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                  {calculation.winningHits.map((win, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 p-2.5 rounded-xl border border-emerald-800/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-white text-sm">{win.customerName}</strong>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ထိုးကြေး: {win.amount.toLocaleString()} {currency} x {multiplier}ဆ
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-emerald-400 text-sm block">
                          +{win.payout.toLocaleString()} {currency}
                        </span>
                        <span className="text-[10px] text-slate-500">{win.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs bg-slate-950/50 rounded-xl border border-slate-800">
            ပေါက်ဂဏန်း (၂လုံး) အထက်တွင် ရိုက်ထည့်ပါက အလျော်အစားနှင့် ပေါက်သူများစာရင်းကို တွက်ချက်ပြသပါမည်
          </div>
        )}

        {/* Footer & Copy */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            ပိတ်မည်
          </button>

          {isValidWinNum && (
            <button
              type="button"
              id="copy-settlement-btn"
              onClick={handleCopyReceipt}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              {copiedToast ? "ကော်ပီပြီးပါပြီ!" : "ရှင်းတမ်း ကော်ပီယူမည် (Share)"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
