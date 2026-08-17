import React, { useState, useRef, useEffect } from "react";
import { 
  BetItem, 
  LimitSettings, 
  Slip 
} from "../types";
import { 
  parseSlipText, 
  checkSlipLimits, 
  formatOverLimitSlipForExport 
} from "../utils/parser2d";
import { 
  Clipboard, 
  Camera, 
  Mic, 
  MicOff, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Trash2, 
  HelpCircle, 
  Zap, 
  Send, 
  Upload, 
  Loader2, 
  ListPlus,
  RefreshCw
} from "lucide-react";

interface SlipEntrySectionProps {
  existingNumberTotals: Record<string, number>;
  limitSettings: LimitSettings;
  onSaveSlip: (slipData: {
    customerName: string;
    rawText: string;
    items: BetItem[];
    totalAmount: number;
    notes?: string;
  }) => void;
  currency: string;
}

export const SlipEntrySection: React.FC<SlipEntrySectionProps> = ({
  existingNumberTotals,
  limitSettings,
  onSaveSlip,
  currency,
}) => {
  const [customerName, setCustomerName] = useState("");
  const [inputText, setInputText] = useState("");
  const [activeInputMode, setActiveInputMode] = useState<"text" | "ocr" | "voice">("text");

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Notification / Copy state
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Parse in real-time
  const parseResult = React.useMemo(() => {
    if (!inputText.trim()) {
      return { items: [], totalAmount: 0, unparsedLines: [], recognizedFormulas: [] };
    }
    return parseSlipText(inputText);
  }, [inputText]);

  // Limit check in real-time
  const limitCheckResult = React.useMemo(() => {
    return checkSlipLimits(parseResult.items, existingNumberTotals, limitSettings);
  }, [parseResult.items, existingNumberTotals, limitSettings]);

  // Notification helper
  const showToast = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  // Quick formula inserter
  const insertShortcut = (template: string) => {
    setInputText((prev) => {
      const trimmed = prev.trimEnd();
      return trimmed ? `${trimmed}\n${template}` : template;
    });
  };

  // Handle Save
  const handleSave = () => {
    if (parseResult.items.length === 0) {
      showToast("❌ ထည့်သွင်းထားသော ဂဏန်းမရှိသေးပါ");
      return;
    }

    onSaveSlip({
      customerName: customerName.trim() || "အထွေထွေ",
      rawText: inputText,
      items: parseResult.items,
      totalAmount: parseResult.totalAmount,
      notes: limitCheckResult.isOverLimit
        ? `Limit ကျော်ငွေ ${limitCheckResult.totalOverAmount} ပါရှိ`
        : undefined,
    });

    setSaveSuccessMsg("✅ စလစ်မှတ်တမ်း အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ!");
    setTimeout(() => setSaveSuccessMsg(null), 4000);

    // Reset input fields
    setInputText("");
    setCustomerName("");
  };

  // Copy over-limit slip for forwarding
  const handleCopyOverLimitSlip = () => {
    if (!limitCheckResult.isOverLimit) return;
    const overItems = limitCheckResult.overLimitItems.map((it) => ({
      number: it.number,
      overAmount: it.overAmount,
    }));
    const text = formatOverLimitSlipForExport(overItems, "အပြင်လွှဲ/ပိုငွေ စာရင်း");
    navigator.clipboard.writeText(text);
    showToast("📋 ပိုငွေ/အပြင်လွှဲစလစ် ကော်ပီကူးယူပြီးပါပြီ!");
  };

  // Handle Image Upload & Gemini Vision OCR
  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        setOcrPreviewUrl(base64Data);

        const response = await fetch("/api/gemini/ocr-slip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || "image/jpeg",
          }),
        });

        const resData = await response.json();
        if (!response.ok || !resData.success) {
          throw new Error(resData.error || "OCR Scan Failed");
        }

        const data = resData.data;
        if (data.customerName && !customerName) {
          setCustomerName(data.customerName);
        }

        if (data.rawText) {
          setInputText((prev) => (prev ? `${prev}\n${data.rawText}` : data.rawText));
        } else if (data.items && Array.isArray(data.items)) {
          // Construct text
          const lines = data.items.map(
            (it: any) => `${(it.numbers || []).join(",")}=${it.amount}`
          );
          setInputText((prev) => (prev ? `${prev}\n${lines.join("\n")}` : lines.join("\n")));
        }

        showToast("✨ ပုံထဲမှ စာသားများကို ဖတ်ယူပြီးပါပြီ!");
        setActiveInputMode("text");
      } catch (err: any) {
        console.error("OCR error:", err);
        setOcrError(err.message || "Failed to scan image.");
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Voice Recording
  const startRecording = async () => {
    try {
      // First try Web Speech API if supported
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = "my-MM"; // Burmese or default
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsRecording(true);
          setVoiceTranscript("အသံနားထောင်နေပါသည် (ဥပမာ- '၁၂ ၃၄ ၅၀၀ ၊ အပူး ၃၀၀')...");
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setVoiceTranscript(transcript);
          setInputText((prev) => (prev ? `${prev}\n${transcript}` : transcript));
          showToast("🎙️ အသံမှတ်တမ်း စာသားအဖြစ် ပြောင်းလဲပြီးပါပြီ!");
          setIsRecording(false);
        };

        recognition.onerror = async (event: any) => {
          console.warn("Web Speech error, switching to Gemini Audio:", event.error);
          // Fallback to MediaRecorder & Gemini
          fallbackToAudioRecorder();
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
      } else {
        fallbackToAudioRecorder();
      }
    } catch (err) {
      console.warn("Web speech not available, fallback to audio recorder", err);
      fallbackToAudioRecorder();
    }
  };

  const fallbackToAudioRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await sendAudioToGemini(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setVoiceTranscript("အသံဖမ်းယူနေပါသည်... စကားပြောပြီးပါက 'ရပ်တန့်မည်' ကို နှိပ်ပါ။");
    } catch (err: any) {
      alert("Microphone permission required for voice input: " + err.message);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setVoiceLoading(true);
    }
  };

  const sendAudioToGemini = async (audioBlob: Blob) => {
    setVoiceLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const response = await fetch("/api/gemini/audio-transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: "audio/webm",
          }),
        });

        const resData = await response.json();
        if (resData.success && resData.data) {
          const slip = resData.data.formattedSlip || resData.data.transcription;
          if (slip) {
            setInputText((prev) => (prev ? `${prev}\n${slip}` : slip));
            showToast("🎙️ အသံမှတ်တမ်း စာသားအဖြစ် ပြောင်းလဲပြီးပါပြီ!");
          }
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (err) {
      console.error("Audio error:", err);
    } finally {
      setVoiceLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Toast Notification */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-emerald-500/50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{copiedNotification}</span>
        </div>
      )}

      {/* LEFT COLUMN: Input Card & Special Shortcuts (7 Columns) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Main Entry Card */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
          {/* Header & Modes */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-base font-bold text-white">
                စလစ်စာရင်း ထည့်သွင်းခြင်း (Auto Run Parser)
              </h2>
            </div>

            {/* Input Mode Selector */}
            <div className="inline-flex rounded-lg p-1 bg-slate-950 border border-slate-800 text-xs">
              <button
                onClick={() => setActiveInputMode("text")}
                className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                  activeInputMode === "text"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Clipboard className="w-3.5 h-3.5" />
                Copy / Paste စာသား
              </button>
              <button
                onClick={() => {
                  setActiveInputMode("ocr");
                  fileInputRef.current?.click();
                }}
                className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                  activeInputMode === "ocr"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                ပုံမှဖတ်ရန် (OCR)
              </button>
              <button
                onClick={() => setActiveInputMode("voice")}
                className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                  activeInputMode === "voice"
                    ? "bg-amber-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                အသံဖြင့်သွင်းရန်
              </button>
            </div>
          </div>

          {/* Customer Name Input */}
          <div className="mt-3.5 flex items-center gap-3">
            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                ထိုးသား / ကာစတမ်မာ အမည်
              </label>
              <input
                type="text"
                id="customer-name-input"
                placeholder="ဥပမာ- ကိုအောင်၊ မသူဇာ (မထည့်လည်းရ)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="w-full sm:w-1/2 flex items-end">
              <span className="text-xs text-slate-400 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 w-full">
                Limit သတ်မှတ်ချက်: <strong className="text-emerald-400">{limitSettings.minBet} - {limitSettings.defaultLimit} {currency}</strong>
              </span>
            </div>
          </div>

          {/* OCR File Input Hidden */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelected}
            accept="image/*"
            className="hidden"
          />

          {/* OCR Processing Banner */}
          {activeInputMode === "ocr" && (
            <div className="mt-4 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600/20 rounded-lg text-indigo-400">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white">
                      စလစ်ဓာတ်ပုံ သို့မဟုတ် Screenshot တင်ပါ
                    </h4>
                    <p className="text-xs text-indigo-300/80">
                      Gemini Vision AI မှ စလစ်ပါ ဂဏန်းနှင့် ထိုးကြေးများကို အလိုအလျောက် ခွဲခြမ်းဖတ်ပေးပါမည်
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={ocrLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {ocrLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      ဖတ်ယူနေပါသည်...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      ပုံရွေးချယ်ရန်
                    </>
                  )}
                </button>
              </div>

              {ocrError && (
                <div className="mt-3 text-xs text-rose-400 bg-rose-950/50 p-2.5 rounded-lg border border-rose-800/50">
                  {ocrError}
                </div>
              )}

              {ocrPreviewUrl && (
                <div className="mt-3 flex items-center gap-3 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <img
                    src={ocrPreviewUrl}
                    alt="Slip Preview"
                    className="w-14 h-14 object-cover rounded-md border border-slate-700"
                  />
                  <div className="text-xs text-slate-300">
                    <span>တင်ထားသော ပုံမှ စာသားများကို အောက်ပါ Textarea တွင် ဖြည့်သွင်းပြီးပါပြီ။</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Voice Input Banner */}
          {activeInputMode === "voice" && (
            <div className="mt-4 p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-lg ${
                      isRecording
                        ? "bg-rose-600/30 text-rose-400 animate-pulse"
                        : "bg-amber-600/20 text-amber-400"
                    }`}
                  >
                    {isRecording ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white">
                      အသံဖြင့် စလစ်ထည့်သွင်းခြင်း
                    </h4>
                    <p className="text-xs text-amber-300/80">
                      ဥပမာ- "၁၂ ၃၄ ၅၀၀ ၊ အပူး သုံးရာ ၊ ၇ ပတ် တစ်ထောင် ၊ ၂၃ အာ ငါးရာ"
                    </p>
                  </div>
                </div>

                <div>
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={voiceLoading}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
                    >
                      {voiceLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          အသံဖတ်နေသည်...
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          အသံဖမ်းစတင်မည်
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors animate-pulse"
                    >
                      <MicOff className="w-4 h-4" />
                      ရပ်တန့်မည်
                    </button>
                  )}
                </div>
              </div>

              {voiceTranscript && (
                <div className="mt-3 text-xs bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                  <strong className="text-amber-400">ကြားရသော အသံ:</strong> {voiceTranscript}
                </div>
              )}
            </div>
          )}

          {/* Text Area for Slips */}
          <div className="mt-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                စလစ်စာသား ထည့်ရန် (Viber / Messenger မှ Copy Paste ပြုလုပ်နိုင်သည်)
              </label>
              {inputText && (
                <button
                  onClick={() => setInputText("")}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  စာသားရှင်းမည်
                </button>
              )}
            </div>

            <textarea
              id="slip-text-area"
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`ထိုးကြေး စာသားများ ရိုက်ထည့်ပါ သို့မဟုတ် Paste လုပ်ပါ...
ဥပမာ-
12,34,56-500
12 500
23 R 300 (အပြန်အလှန်)
အပူး 500
ခွေ 1234 300
နက္ခတ် 500
ပါဝါ 500
ညီကို 300
7 အပတ် 500
3 ထိပ် 500
8 နောက် 500
စုံစုံ 200`}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-y"
            />
          </div>

          {/* Quick 2D Formula Shortcuts Toolbar */}
          <div className="mt-3.5 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>မြန်ဆန်သော 2D ပုံသေနည်း ကီးဘုတ်ဖြတ်လမ်းများ:</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => insertShortcut("အပူး 500")}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors font-medium"
              >
                + အပူး (00-99)
              </button>
              <button
                type="button"
                onClick={() => insertShortcut("ခွေ 1234 300")}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors font-medium"
              >
                + အခွေ (1234)
              </button>
              <button
                type="button"
                onClick={() => insertShortcut("နက္ခတ် 500")}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors font-medium"
              >
                + နက္ခတ်
              </button>
              <button
                type="button"
                onClick={() => insertShortcut("ပါဝါ 500")}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors font-medium"
              >
                + ပါဝါ
              </button>
              <button
                type="button"
                onClick={() => insertShortcut("ညီကို 300")}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors font-medium"
              >
                + ညီကို
              </button>
              <button
                type="button"
                onClick={() => insertShortcut("7 အပတ် 500")}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors font-medium"
              >
                + ၇ အပတ် (19လုံး)
              </button>
              <button
                type="button"
                onClick={() => insertShortcut("12 R 500")}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors font-medium"
              >
                + R (အပြန်အလှန်)
              </button>
              <button
                type="button"
                onClick={() => insertShortcut("5 ထိပ် 500")}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors font-medium"
              >
                + ထိပ် (50-59)
              </button>
              <button
                type="button"
                onClick={() => insertShortcut("8 နောက် 500")}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors font-medium"
              >
                + နောက် (08-98)
              </button>
              <button
                type="button"
                onClick={() => insertShortcut("စုံစုံ 200")}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors font-medium"
              >
                + စုံစုံ
              </button>
              <button
                type="button"
                onClick={() => insertShortcut("မမ 200")}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors font-medium"
              >
                + မမ
              </button>
              <button
                type="button"
                onClick={() => insertShortcut("ဆယ်ပြည့် 300")}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors font-medium"
              >
                + ဆယ်ပြည့်
              </button>
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="bg-emerald-950/60 border border-emerald-500/50 p-3.5 rounded-xl text-emerald-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{saveSuccessMsg}</span>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Live Calculation Preview & Limit Alert Box (5 Columns) */}
      <div className="lg:col-span-5 space-y-4">
        {/* Real-time Slip Breakdown Card */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">
                  တွက်ချက်ပြီး စလစ်အချက်အလက်
                </h3>
              </div>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                {parseResult.items.length} ဂဏန်း
              </span>
            </div>

            {/* Total Amounts Box */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">စလစ်စုစုပေါင်း:</span>
                <div className="text-xl font-bold text-white mt-1">
                  {parseResult.totalAmount.toLocaleString()} <span className="text-xs text-slate-400">{currency}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">ဒိုင်လက်ခံငွေ (Held):</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {limitCheckResult.totalHeldAmount.toLocaleString()} <span className="text-xs text-emerald-500">{currency}</span>
                </div>
              </div>
            </div>

            {/* CRITICAL: Over-Limit Alert Section */}
            {limitCheckResult.isOverLimit ? (
              <div className="mt-4 p-4 rounded-xl bg-rose-950/70 border-2 border-rose-500 text-rose-200 animate-pulse">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        ⚠️ Limit ကျော်လွန်နေသော ဂဏန်းများ ရှိပါသည်!
                      </h4>
                      <p className="text-xs text-rose-300">
                        စုစုပေါင်း ကျော်လွန်ငွေ (ပိုငွေ): <strong className="text-white text-sm">{limitCheckResult.totalOverAmount.toLocaleString()} {currency}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Over-Limit Numbers List */}
                <div className="mt-3 max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {limitCheckResult.overLimitItems.map((item) => (
                    <div
                      key={item.number}
                      className="bg-slate-950/80 p-2 rounded-lg border border-rose-800/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white bg-rose-600 px-2 py-0.5 rounded text-sm">
                          {item.number}
                        </span>
                        <span className="text-slate-300">
                          ယခင်({item.existingAmount}) + ယခု({item.addingAmount}) = <strong className="text-rose-300">{item.newTotal}</strong>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-rose-400 font-bold">
                          +{item.overAmount.toLocaleString()} ကျော်
                        </span>
                        <div className="text-[10px] text-slate-400">
                          (Limit: {item.limit})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Action: Copy Over-Limit Spill */}
                <button
                  type="button"
                  id="copy-over-limit-btn"
                  onClick={handleCopyOverLimitSlip}
                  className="mt-3 w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  ပိုငွေ / အပြင်လွှဲ စလစ် ကော်ပီယူမည်
                </button>
              </div>
            ) : (
              <div className="mt-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>ဂဏန်းအားလုံး Limit သတ်မှတ်ချက်အတွင်း ရှိနေပါသည် (အေးဆေးလက်ခံနိုင်သည်)။</span>
              </div>
            )}

            {/* Formula Breakdown Tags */}
            {parseResult.recognizedFormulas.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-semibold text-slate-400 block mb-1.5">
                  အလိုအလျောက် သတ်မှတ်ရရှိသော ပုံသေနည်းများ:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {parseResult.recognizedFormulas.map((f, i) => (
                    <span
                      key={i}
                      className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-md font-mono"
                    >
                      {f.formula} ({f.count} လုံး)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Unrecognized Lines Warning */}
            {parseResult.unparsedLines.length > 0 && (
              <div className="mt-3 p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs">
                <div className="flex items-center gap-1.5 font-semibold mb-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>ဖတ်မရသော စာကြောင်းများ ({parseResult.unparsedLines.length}):</span>
                </div>
                <div className="font-mono text-[11px] opacity-80 max-h-16 overflow-y-auto">
                  {parseResult.unparsedLines.join(" | ")}
                </div>
              </div>
            )}

            {/* Compact Numbers Preview Table */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-slate-400 block mb-1.5">
                ဂဏန်းနှင့် ထိုးကြေး အသေးစိတ် ({parseResult.items.length} တွဲ):
              </span>
              <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950 p-2 grid grid-cols-3 sm:grid-cols-4 gap-1.5 text-xs font-mono">
                {parseResult.items.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-slate-600 font-sans">
                    စလစ်စာသားများ ထည့်သွင်းပါက ဤနေရာတွင် ဂဏန်းများ တွက်ချက်ပြသပါမည်
                  </div>
                ) : (
                  parseResult.items.map((item) => {
                    const isOver = limitCheckResult.overLimitItems.some(
                      (o) => o.number === item.number
                    );
                    return (
                      <div
                        key={item.number}
                        className={`px-2 py-1 rounded flex items-center justify-between border ${
                          isOver
                            ? "bg-rose-950/60 border-rose-600/60 text-rose-300"
                            : "bg-slate-900 border-slate-800 text-slate-300"
                        }`}
                      >
                        <span className="font-bold text-white">{item.number}</span>
                        <span className="text-emerald-400">{item.amount.toLocaleString()}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 pt-3 border-t border-slate-800 flex items-center gap-3">
            <button
              type="button"
              id="save-slip-btn"
              disabled={parseResult.items.length === 0}
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black py-3 rounded-xl text-sm shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-4 h-4" />
              စလစ်မှတ်တမ်း သိမ်းဆည်းမည် ({parseResult.totalAmount.toLocaleString()} {currency})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
