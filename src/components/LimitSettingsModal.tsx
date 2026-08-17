import React, { useState } from "react";
import { LimitSettings } from "../types";
import { Sliders, X, Check, Plus, Trash2, AlertCircle } from "lucide-react";

interface LimitSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LimitSettings;
  onSave: (newSettings: LimitSettings) => void;
}

export const LimitSettingsModal: React.FC<LimitSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [defaultLimit, setDefaultLimit] = useState(settings.defaultLimit);
  const [minBet, setMinBet] = useState(settings.minBet);
  const [multiplier, setMultiplier] = useState(settings.multiplier);
  const [commissionRate, setCommissionRate] = useState(settings.commissionRate);
  const [customLimits, setCustomLimits] = useState<Record<string, number>>({
    ...settings.customLimits,
  });

  const [customNumInput, setCustomNumInput] = useState("");
  const [customLimitInput, setCustomLimitInput] = useState("");

  // Sync settings when modal opens or settings change
  React.useEffect(() => {
    if (isOpen) {
      setDefaultLimit(settings.defaultLimit);
      setMinBet(settings.minBet);
      setMultiplier(settings.multiplier);
      setCommissionRate(settings.commissionRate);
      setCustomLimits({ ...settings.customLimits });
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleAddCustomLimit = () => {
    const num = customNumInput.trim();
    const limit = parseInt(customLimitInput, 10);
    if (!/^\d{2}$/.test(num) || isNaN(limit) || limit <= 0) {
      alert("ကျေးဇူးပြု၍ ၂လုံးဂဏန်း (00-99) နှင့် Limit ပမာဏ မှန်ကန်စွာ ထည့်ပါ");
      return;
    }
    setCustomLimits((prev) => ({ ...prev, [num]: limit }));
    setCustomNumInput("");
    setCustomLimitInput("");
  };

  const handleRemoveCustomLimit = (num: string) => {
    setCustomLimits((prev) => {
      const copy = { ...prev };
      delete copy[num];
      return copy;
    });
  };

  const handleSaveAll = () => {
    onSave({
      ...settings,
      defaultLimit: Math.max(1, defaultLimit),
      minBet: Math.max(1, minBet),
      multiplier: Math.max(1, multiplier),
      commissionRate: Math.max(0, commissionRate),
      customLimits,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                ထိုးကြေး Limit နှင့် စနစ် သတ်မှတ်ချက်များ
              </h3>
              <p className="text-xs text-slate-400">
                Limit ပမာဏ၊ ပေါက်ကြေးအဆနှင့် ကော်မရှင်နှုန်းထားများ
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

        {/* Global Settings */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                အနိမ့်ဆုံး ထိုးကြေး (Min Bet)
              </label>
              <input
                type="number"
                value={minBet}
                onChange={(e) => setMinBet(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500">ပုံမှန်: 100 Baht</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                မူလ ထိုးကြေး Limit (Default Max)
              </label>
              <input
                type="number"
                value={defaultLimit}
                onChange={(e) => setDefaultLimit(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-400 font-mono font-bold focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500">ပုံမှန်: 1000 Baht</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ပေါက်ကြေး အဆ (Payout Multiplier)
              </label>
              <input
                type="number"
                value={multiplier}
                onChange={(e) => setMultiplier(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500">ဥပမာ- 85ဆ (၁၀၀ လျှင် ၈၅၀၀)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ကော်မရှင် ရာခိုင်နှုန်း (%)
              </label>
              <input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500">ဥပမာ- 15% သို့မဟုတ် 10%</span>
            </div>
          </div>

          {/* Custom Hot Number Limits */}
          <div className="pt-3 border-t border-slate-800">
            <label className="block text-xs font-bold text-white mb-2">
              ဂဏန်းအလိုက် သီးသန့် Limit သတ်မှတ်ရန် (Hot Numbers)
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={2}
                placeholder="ဂဏန်း (00-99)"
                value={customNumInput}
                onChange={(e) => setCustomNumInput(e.target.value)}
                className="w-32 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Limit ပမာဏ (ဥပမာ- 500)"
                value={customLimitInput}
                onChange={(e) => setCustomLimitInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomLimit}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
                ထည့်မည်
              </button>
            </div>

            {/* Custom Limits List */}
            <div className="mt-3 max-h-32 overflow-y-auto space-y-1.5 pr-1">
              {Object.keys(customLimits).length === 0 ? (
                <div className="text-center py-2 text-slate-600 text-xs bg-slate-950/60 rounded-lg">
                  သီးသန့်သတ်မှတ်ထားသော ဂဏန်းမရှိသေးပါ (အားလုံး မူလ Limit အတိုင်း အလုပ်လုပ်ပါမည်)
                </div>
              ) : (
                Object.entries(customLimits).map(([num, lim]) => (
                  <div
                    key={num}
                    className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40">
                        {num}
                      </span>
                      <span className="text-slate-300">
                        Limit: <strong className="text-white">{lim}</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveCustomLimit(num)}
                      className="text-rose-400 hover:text-rose-300 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            မလုပ်တော့ပါ
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg transition-transform active:scale-95"
          >
            <Check className="w-4 h-4" />
            ဆက်တင်များ သိမ်းဆည်းမည်
          </button>
        </div>
      </div>
    </div>
  );
};
