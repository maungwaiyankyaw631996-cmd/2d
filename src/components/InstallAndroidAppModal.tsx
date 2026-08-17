import React, { useState, useEffect } from "react";
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  X, 
  ExternalLink, 
  Share2, 
  Sparkles, 
  ShieldCheck, 
  WifiOff, 
  Zap, 
  Copy 
} from "lucide-react";

interface InstallAndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  installPromptEvent: any;
  onTriggerInstall: () => void;
}

export const InstallAndroidAppModal: React.FC<InstallAndroidAppModalProps> = ({
  isOpen,
  onClose,
  installPromptEvent,
  onTriggerInstall,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const currentAppUrl = window.location.href;

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-1.5">
                Android App အဖြစ် ဖုန်းထဲထည့်သွင်းရန်
              </h3>
              <p className="text-xs text-emerald-400">
                PWA & Standalone Android App System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Perks */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800">
            <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <span className="text-slate-300 font-medium block">အင်တာနက်မလို</span>
            <span className="text-[10px] text-slate-500">Offline သုံးနိုင်</span>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800">
            <Smartphone className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <span className="text-slate-300 font-medium block">Full Screen</span>
            <span className="text-[10px] text-slate-500">App သီးသန့်စနစ်</span>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800">
            <ShieldCheck className="w-5 h-5 text-sky-400 mx-auto mb-1" />
            <span className="text-slate-300 font-medium block">မြန်ဆန်သွက်လက်</span>
            <span className="text-[10px] text-slate-500">ဖုန်းထဲသိမ်းဆည်း</span>
          </div>
        </div>

        {/* 1-Click Install Button (if browser supports install prompt) */}
        {installPromptEvent ? (
          <div className="bg-gradient-to-r from-emerald-950/80 to-teal-950/80 p-4 rounded-2xl border border-emerald-500/50 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              သင့် Browser က တိုက်ရိုက် Install လုပ်ခွင့်ပြုထားပါသည်
            </div>
            <button
              onClick={() => {
                onTriggerInstall();
                onClose();
              }}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Download className="w-5 h-5" />
              ယခုပဲ Android App အဖြစ် Install ပြုလုပ်မည်
            </button>
          </div>
        ) : null}

        {/* Step by Step Manual Install Guide for Android */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <h4 className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            Android ဖုန်းထဲသို့ အက်ပ်အဖြစ် ထည့်သွင်းနည်း (၃) ဆင့်:
          </h4>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono flex items-center justify-center flex-shrink-0 text-xs">
                1
              </span>
              <div>
                ဖုန်း၏ <strong>Google Chrome</strong> (သို့မဟုတ် Samsung Internet Browser) ဖြင့် App Link ကို ဖွင့်ပါ။
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono flex items-center justify-center flex-shrink-0 text-xs">
                2
              </span>
              <div>
                Browser ၏ ညာဘက်အပေါ်ထောင့်ရှိ <strong>အစက် (၃) စက် (⋮) Menu</strong> ကို နှိပ်ပါ။
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono flex items-center justify-center flex-shrink-0 text-xs">
                3
              </span>
              <div>
                <strong>"Install app"</strong> (သို့မဟုတ် <strong>"Add to Home screen" / "ပင်မစခရင်သို့ ထည့်ရန်"</strong>) ကို ရွေးချယ်ပြီး <strong>"Install"</strong> နှိပ်ပါ။
              </div>
            </div>
          </div>

          <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/50 text-[11px] text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>ဖုန်း Screen ပေါ်တွင် <strong>"2D Ledger"</strong> Logo ဖြင့် Native Android App အဖြစ် ချက်ချင်း အသုံးပြုနိုင်ပါပြီ!</span>
          </div>
        </div>

        {/* App Link Share / Copy */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400">
            ဖုန်းထဲတွင် ဖွင့်ရန် App Link:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentAppUrl}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedLink ? "ကော်ပီပြီး!" : "Link ကော်ပီ"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            ပိတ်မည်
          </button>
        </div>
      </div>
    </div>
  );
};
