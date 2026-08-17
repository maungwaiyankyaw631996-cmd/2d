import React, { useState } from "react";
import { Slip, CashTransaction, LimitSettings } from "../types";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Copy, 
  Calendar, 
  FileSpreadsheet, 
  CheckCircle2, 
  ArrowDownRight, 
  ArrowUpRight 
} from "lucide-react";

interface DailyLedgerTrackerProps {
  slips: Slip[];
  allDaySlips: Slip[];
  transactions: CashTransaction[];
  onAddTransaction: (t: Omit<CashTransaction, "id" | "timestamp">) => void;
  onDeleteTransaction: (id: string) => void;
  date: string;
  currency: string;
  settings: LimitSettings;
}

export const DailyLedgerTracker: React.FC<DailyLedgerTrackerProps> = ({
  slips,
  allDaySlips,
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  date,
  currency,
  settings,
}) => {
  const [transType, setTransType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("ရုံးအသုံးစရိတ်");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [copied, setCopied] = useState(false);

  // Financial Stats
  const morningSlips = allDaySlips.filter((s) => s.session === "morning");
  const eveningSlips = allDaySlips.filter((s) => s.session === "evening");

  const morningTotal = morningSlips.reduce((sum, s) => sum + s.totalAmount, 0);
  const eveningTotal = eveningSlips.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalSales = morningTotal + eveningTotal;

  const totalCommission = (totalSales * (settings.commissionRate || 15)) / 100;

  // Transactions calculations
  const totalExtraIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExtraExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = totalSales + totalExtraIncome - totalExtraExpense;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("ကျေးဇူးပြု၍ ပမာဏ မှန်ကန်စွာ ထည့်ပါ");
      return;
    }

    onAddTransaction({
      type: transType,
      category,
      amount: numAmount,
      description: description.trim() || category,
      date,
      session: "morning", // default
    });

    setAmount("");
    setDescription("");
  };

  // Copy full daily accounting report
  const handleCopyDailyReport = () => {
    let text = `📊 === တစ်နေ့တာ 2D ငွေစာရင်းချုပ် အစီရင်ခံစာ ===\n`;
    text += `📅 နေ့စွဲ: ${date}\n`;
    text += `--------------------------------\n`;
    text += `🌅 မနက်ပိုင်း (12:01) ရောင်းရငွေ: ${morningTotal.toLocaleString()} ${currency} (${morningSlips.length} စောင်)\n`;
    text += `🌇 ညနေပိုင်း (4:30) ရောင်းရငွေ: ${eveningTotal.toLocaleString()} ${currency} (${eveningSlips.length} စောင်)\n`;
    text += `💰 စုစုပေါင်း အရောင်း: ${totalSales.toLocaleString()} ${currency}\n`;
    text += `💵 ကော်မရှင် ခန့်မှန်း (${settings.commissionRate}%): ${totalCommission.toLocaleString()} ${currency}\n`;
    text += `--------------------------------\n`;
    text += `📈 အထွေထွေ ဝင်ငွေ: +${totalExtraIncome.toLocaleString()} ${currency}\n`;
    text += `📉 အထွေထွေ ထွက်ငွေ/စရိတ်: -${totalExtraExpense.toLocaleString()} ${currency}\n`;
    text += `--------------------------------\n`;
    text += `💎 စုစုပေါင်း ငွေလက်ကျန်: ${netCashFlow.toLocaleString()} ${currency}\n`;
    text += `--------------------------------\n`;
    text += `📝 အသုံးစရိတ်/ဝင်ငွေ စာရင်း:\n`;
    transactions.forEach((t, i) => {
      text += `${i + 1}. [${t.type === "income" ? "+" : "-"}] ${t.category}: ${t.amount} ${currency} (${t.description})\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>မနက်ပိုင်း အရောင်း (12:01)</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-2">
            {morningTotal.toLocaleString()} <span className="text-xs text-slate-400">{currency}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {morningSlips.length} စလစ်စောင်ရေ
          </span>
        </div>

        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>ညနေပိုင်း အရောင်း (4:30)</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-400 mt-2">
            {eveningTotal.toLocaleString()} <span className="text-xs text-slate-400">{currency}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {eveningSlips.length} စလစ်စောင်ရေ
          </span>
        </div>

        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>တစ်နေ့တာ စုစုပေါင်း အရောင်း</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-2">
            {totalSales.toLocaleString()} <span className="text-xs text-slate-400">{currency}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            ကော်မရှင်: {totalCommission.toLocaleString()} {currency}
          </span>
        </div>

        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>အသားတင် လက်ကျန်ငွေ</span>
            <DollarSign className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold font-mono text-sky-400 mt-2">
            {netCashFlow.toLocaleString()} <span className="text-xs text-slate-400">{currency}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            ဝင်ငွေ (+{totalExtraIncome}) / စရိတ် (-{totalExtraExpense})
          </span>
        </div>
      </div>

      {/* Cash Transactions Form & Ledger Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Add Entry Card (4 Columns) */}
        <div className="lg:col-span-4 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Plus className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">
              ဝင်ငွေ / ထွက်ငွေ စာရင်းသွင်းရန်
            </h3>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setTransType("expense");
                  setCategory("ရုံးအသုံးစရိတ်");
                }}
                className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                  transType === "expense"
                    ? "bg-rose-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                ထွက်ငွေ / စရိတ်
              </button>
              <button
                type="button"
                onClick={() => {
                  setTransType("income");
                  setCategory("ကော်မရှင်ရငွေ");
                }}
                className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                  transType === "income"
                    ? "bg-emerald-600 text-slate-950 shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                ဝင်ငွေ / အကြွေးရ
              </button>
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                အမျိုးအစား (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                {transType === "expense" ? (
                  <>
                    <option value="ရုံးအသုံးစရိတ်">ရုံးအသုံးစရိတ် / အထွေထွေ</option>
                    <option value="လျော်ကြေးပေးငွေ">လျော်ကြေးပေးငွေ (Payout)</option>
                    <option value="ကော်မရှင်ခွဲပေး">ကော်မရှင်ခွဲပေးငွေ</option>
                    <option value="ဖုန်းဘေလ်/အင်တာနက်">ဖုန်းဘေလ် / အင်တာနက်</option>
                    <option value="စားသောက်စရိတ်">စားသောက်စရိတ် / ကော်ဖီ</option>
                    <option value="အခြားစရိတ်">အခြားစရိတ်</option>
                  </>
                ) : (
                  <>
                    <option value="ကော်မရှင်ရငွေ">ကော်မရှင်ရငွေ</option>
                    <option value="အကြွေးဟောင်းရငွေ">အကြွေးဟောင်း ရရှိငွေ</option>
                    <option value="အပိုဝင်ငွေ">အပိုဝင်ငွေ</option>
                    <option value="ဒိုင်ထည့်ငွေ">ဒိုင်ထည့်ဝင်ငွေ (Capital)</option>
                  </>
                )}
              </select>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                ငွေပမာဏ ({currency})
              </label>
              <input
                type="number"
                placeholder="ဥပမာ- 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                မှတ်ချက် / အကြောင်းအရာ
              </label>
              <input
                type="text"
                placeholder="ဥပမာ- ကိုမင်း အကြွေးဆပ်၊ ကော်ဖီမုန့်ဖိုး"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              စာရင်းမှတ်မည်
            </button>
          </form>
        </div>

        {/* Transactions Table & Export (8 Columns) */}
        <div className="lg:col-span-8 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-white">
                တစ်နေ့တာ ဝင်/ထွက်ငွေ စာရင်းမှတ်တမ်းများ ({transactions.length} ခု)
              </h3>
              <p className="text-xs text-slate-400">
                နေ့စွဲ: {date}
              </p>
            </div>

            <button
              onClick={handleCopyDailyReport}
              className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "ကော်ပီပြီးပါပြီ!" : "နေ့စဉ်စာရင်းချုပ် ကော်ပီ (Export)"}
            </button>
          </div>

          {/* Table */}
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
              ယနေ့အတွက် ဝင်ငွေ/ထွက်ငွေ မှတ်တမ်း မရှိသေးပါ
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {transactions.map((t) => {
                const isIncome = t.type === "income";
                return (
                  <div
                    key={t.id}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isIncome
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {isIncome ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <strong className="text-white text-sm">{t.category}</strong>
                        <p className="text-slate-400 text-[11px]">{t.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`font-mono font-bold text-sm ${
                          isIncome ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {t.amount.toLocaleString()} {currency}
                      </span>
                      <button
                        onClick={() => onDeleteTransaction(t.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="ဖျက်မည်"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
