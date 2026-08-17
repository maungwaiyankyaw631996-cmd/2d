import React, { useState } from "react";
import { Slip } from "../types";
import { formatSlipForExport } from "../utils/parser2d";
import { 
  FileText, 
  Search, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  User, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle 
} from "lucide-react";

interface SlipsListProps {
  slips: Slip[];
  onDeleteSlip: (slipId: string) => void;
  currency: string;
  session: string;
  date: string;
}

export const SlipsList: React.FC<SlipsListProps> = ({
  slips,
  onDeleteSlip,
  currency,
  session,
  date,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSlipId, setExpandedSlipId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSlips = slips.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.customerName.toLowerCase().includes(q) ||
      s.items.some((it) => it.number.includes(q)) ||
      s.totalAmount.toString().includes(q)
    );
  });

  const totalSlipsAmount = slips.reduce((sum, s) => sum + s.totalAmount, 0);

  const handleCopySlip = (slip: Slip) => {
    const text = formatSlipForExport(slip.items, slip.customerName, slip.session, slip.date);
    navigator.clipboard.writeText(text);
    setCopiedId(slip.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyAllSlips = () => {
    let allText = `=== 2D စလစ်များ စုစည်းမှု (${date} - ${session === "morning" ? "မနက်" : "ညနေ"}) ===\n`;
    slips.forEach((s, idx) => {
      allText += `\n[${idx + 1}] ${s.customerName} (${s.timestamp}) - စုစုပေါင်း: ${s.totalAmount} ${currency}\n`;
      s.items.forEach((it) => {
        allText += `  ${it.number} = ${it.amount}\n`;
      });
    });
    allText += `\n----------------\nစုစုပေါင်း စလစ်စောင်ရေ: ${slips.length}\nစုစုပေါင်း အရောင်းငွေ: ${totalSlipsAmount.toLocaleString()} ${currency}`;
    navigator.clipboard.writeText(allText);
    alert("စလစ်အားလုံး ကော်ပီကူးယူပြီးပါပြီ!");
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">
              စလစ်မှတ်တမ်းများ ({slips.length} စောင်)
            </h3>
            <p className="text-xs text-slate-400">
              စုစုပေါင်း ပမာဏ: <strong className="text-emerald-400 font-mono">{totalSlipsAmount.toLocaleString()} {currency}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ထိုးသားအမည် သို့မဟုတ် ဂဏန်း ရှာရန်..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={handleCopyAllSlips}
            disabled={slips.length === 0}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Copy className="w-3.5 h-3.5" />
            အားလုံး ကော်ပီ
          </button>
        </div>
      </div>

      {/* Slips Cards List */}
      {filteredSlips.length === 0 ? (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-12 text-center text-slate-500 text-sm">
          {searchQuery ? "ရှာဖွေမှုနှင့် ကိုက်ညီသော စလစ်မရှိပါ" : "ဤအပိုင်းအတွက် စလစ်မှတ်တမ်း မရှိသေးပါ"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSlips.map((slip, index) => {
            const isExpanded = expandedSlipId === slip.id;
            return (
              <div
                key={slip.id}
                className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
              >
                {/* Slip Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-mono font-bold text-xs flex items-center justify-center border border-slate-700">
                      #{index + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        {slip.customerName}
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {slip.timestamp}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400 text-base block">
                      {slip.totalAmount.toLocaleString()} {currency}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {slip.items.length} ဂဏန်း
                    </span>
                  </div>
                </div>

                {/* Numbers Preview or Expanded view */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span>ပါဝင်သော ဂဏန်းများ:</span>
                    <button
                      onClick={() => setExpandedSlipId(isExpanded ? null : slip.id)}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px]"
                    >
                      {isExpanded ? (
                        <>
                          ခေါက်သိမ်းမည် <ChevronUp className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          အသေးစိတ်ကြည့်မည် ({slip.items.length}) <ChevronDown className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>

                  {isExpanded ? (
                    <div className="max-h-48 overflow-y-auto bg-slate-950 p-2.5 rounded-xl border border-slate-800 grid grid-cols-3 sm:grid-cols-4 gap-1.5 text-xs font-mono">
                      {slip.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900 px-2 py-1 rounded border border-slate-800 flex items-center justify-between"
                        >
                          <span className="font-bold text-white">{item.number}</span>
                          <span className="text-emerald-400">{item.amount}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1 bg-slate-950 p-2 rounded-xl border border-slate-800 max-h-16 overflow-hidden text-[11px] font-mono">
                      {slip.items.slice(0, 10).map((item, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-300 border border-slate-800"
                        >
                          {item.number}={item.amount}
                        </span>
                      ))}
                      {slip.items.length > 10 && (
                        <span className="text-slate-500 self-center">
                          +{slip.items.length - 10} ပို...
                        </span>
                      )}
                    </div>
                  )}

                  {slip.notes && (
                    <div className="mt-2 text-[11px] text-amber-300 bg-amber-950/30 px-2 py-1 rounded border border-amber-800/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {slip.notes}
                    </div>
                  )}
                </div>

                {/* Slip Actions */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopySlip(slip)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedId === slip.id ? "ကော်ပီပြီးပါပြီ!" : "စလစ် ကော်ပီ"}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`ထိုးသား '${slip.customerName}' ၏ စလစ်အား ဖျက်ပစ်ရန် သေချာပါသလား?`)) {
                        onDeleteSlip(slip.id);
                      }
                    }}
                    className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 rounded-lg transition-colors"
                    title="စလစ်ဖျက်မည်"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
