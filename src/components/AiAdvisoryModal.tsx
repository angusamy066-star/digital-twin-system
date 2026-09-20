import React, { useState } from "react";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  FileText,
  Copy,
  Check,
  ShieldCheck,
  Cpu,
  RefreshCw
} from "lucide-react";
import { TelemetrySample, DigitalTwinState, EngineProfile } from "../types";

interface AiAdvisoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: TelemetrySample;
  twin: DigitalTwinState;
  activeFault: string;
  profile: EngineProfile;
}

export const AiAdvisoryModal: React.FC<AiAdvisoryModalProps> = ({
  isOpen,
  onClose,
  telemetry,
  twin,
  activeFault,
  profile
}) => {
  const [query, setQuery] = useState<string>("");
  const [advisoryText, setAdvisoryText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [source, setSource] = useState<string>("");
  const [modelName, setModelName] = useState<string>("");
  const [notice, setNotice] = useState<string>("");

  if (!isOpen) return null;

  const handleGenerateAdvisory = async (customPrompt?: string) => {
    setLoading(true);
    setNotice("");
    try {
      const res = await fetch("/api/ai/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telemetry,
          twin,
          fault: activeFault,
          question: customPrompt || query || "Generate a comprehensive aerospace propulsion diagnostic brief and maintenance directive."
        })
      });
      const data = await res.json();
      if (data.advisory) {
        setAdvisoryText(data.advisory);
        setSource(data.source || "gemini_ai");
        if (data.model) setModelName(data.model);
        if (data.notice) setNotice(data.notice);
      }
    } catch (err) {
      console.warn("Advisory request error, using offline diagnostics:", err);
      setAdvisoryText("Failed to communicate with AI diagnostic service. Please check network connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(advisoryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                Gemini Propulsion Specialist & Diagnostics AI
              </h3>
              <p className="text-[11px] text-slate-400">
                SIH26054 Autonomous Advisory Engineering System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {source && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {source === "gemini_ai" ? (modelName || "Gemini AI") : "Rule Engine Fallback"}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {notice && (
          <div className="px-6 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Live Context Strip */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-slate-500">Engine: <strong className="text-slate-800">{profile.id}</strong></span>
            <span className="text-slate-500">Health: <strong className={twin.health_score < 70 ? "text-red-600" : "text-emerald-600"}>{twin.health_score}%</strong></span>
            <span className="text-slate-500">RUL: <strong className="text-blue-600">{twin.rul_hours}h</strong></span>
            <span className="text-slate-500">Reliability: <strong className="text-slate-800">{twin.mission_reliability}%</strong></span>
          </div>
          {activeFault !== "none" && (
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-medium text-[11px]">
              Active Injection: {activeFault}
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {!advisoryText && !loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <Cpu className="w-12 h-12 text-blue-500 mb-3" />
              <h4 className="font-bold text-slate-900 text-base">
                Ready to Evaluate Engine Telemetry
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Click below to synthesize a full propulsion briefing, isolate active residuals against calibrated normal distributions, and generate ground-station work directives.
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => handleGenerateAdvisory("Perform full engine telemetry diagnosis and root-cause analysis.")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  Generate Root-Cause Diagnostic Brief
                </button>
                <button
                  onClick={() => handleGenerateAdvisory("Evaluate mission risk: Should the drone abort or continue flight?")}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  Evaluate Mission Abort Risk
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <div className="font-bold text-slate-800 text-sm">
                Propulsion Specialist Reasoning...
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Analyzing sensor residuals, Weibull hazard probability, and ATA chapter compliance
              </p>
            </div>
          )}

          {advisoryText && !loading && (
            <div className="relative">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Aeronautical Diagnostic Memorandum
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    onClick={() => handleGenerateAdvisory()}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-evaluate</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                {advisoryText}
              </div>
            </div>
          )}
        </div>

        {/* Query Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerateAdvisory()}
            placeholder="Ask a specific propulsion question (e.g., 'What is causing the -3.2σ oil pressure drop?')..."
            className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
          <button
            onClick={() => handleGenerateAdvisory()}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Consult AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
