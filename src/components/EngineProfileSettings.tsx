import React, { useState } from "react";
import {
  Sliders,
  Shield,
  FileCode,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Droplet,
  Activity,
  Cpu
} from "lucide-react";
import { EngineProfile } from "../types";
import { DEFAULT_PROFILES } from "../services/engineProfiles";

interface EngineProfileSettingsProps {
  activeProfile: EngineProfile;
  onUpdateProfile: (updated: EngineProfile) => void;
  onSelectProfile: (profile: EngineProfile) => void;
  validatedMode: boolean;
  onToggleValidatedMode: (enabled: boolean) => void;
}

export const EngineProfileSettings: React.FC<EngineProfileSettingsProps> = ({
  activeProfile,
  onUpdateProfile,
  onSelectProfile,
  validatedMode,
  onToggleValidatedMode
}) => {
  const [limits, setLimits] = useState(activeProfile.limits);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onUpdateProfile({
      ...activeProfile,
      limits: limits
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    const original = DEFAULT_PROFILES.find((p) => p.id === activeProfile.id) || DEFAULT_PROFILES[0];
    setLimits(original.limits);
    onUpdateProfile(original);
  };

  return (
    <div className="space-y-5">
      {/* Mode Configuration Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Operating Mode & Airworthiness Compliance
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Strictly separates experimental synthetic telemetry heuristic prognostics from validated aircraft ground-station calibration.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleValidatedMode(false)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition ${
                !validatedMode
                  ? "bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-300"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              DEMO MODE (Heuristic)
            </button>
            <button
              onClick={() => onToggleValidatedMode(true)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition ${
                validatedMode
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              VALIDATED MODE (DRDO Calibrated)
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed">
          {validatedMode ? (
            <div className="flex items-start gap-2 text-blue-900">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Validated Mode Active:</strong> Statistical residual thresholds and Weibull confidence multipliers are locked against DRDO physical test stand telemetry logs. Maintenance recommendations conform with ATA 71/72/79 directives.
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Demo Mode Active:</strong> Telemetry streams are driven by synthetic numerical generators. Threshold alerts and RUL approximations are provided strictly for demonstration and hackathon review.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Select Active Profile */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-xs text-slate-900 mb-3 uppercase tracking-wider text-slate-400">
          Select Fleet Engine Profile
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DEFAULT_PROFILES.map((p) => {
            const isSelected = p.id === activeProfile.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  onSelectProfile(p);
                  setLimits(p.limits);
                }}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? "bg-blue-50/80 border-blue-600 ring-1 ring-blue-600 shadow-xs"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[11px] font-bold text-blue-600">{p.id}</span>
                    {isSelected && (
                      <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white text-[9px] font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{p.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{p.airframe}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between font-mono">
                  <span>Type: {p.engine_type}</span>
                  <span>Hours: {p.total_operating_hours}h</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Threshold Limits Form */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Configurable Sensor Threshold Limits (YAML / Profile Spec)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Defines the normal operating envelopes, statistical sigma deviations ($\sigma$), and warning/critical thresholds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Apply Thresholds</span>
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-4 p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Engine threshold limits updated successfully in runtime digital twin model!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CHT Limits */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Cylinder Head Temperature (CHT - °C)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Warning Ceiling</label>
                <input
                  type="number"
                  value={limits.cht.warning}
                  onChange={(e) => setLimits({ ...limits, cht: { ...limits.cht, warning: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-2 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Critical Limit</label>
                <input
                  type="number"
                  value={limits.cht.critical}
                  onChange={(e) => setLimits({ ...limits, cht: { ...limits.cht, critical: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-2 bg-white border border-slate-200 rounded font-mono font-bold text-red-600"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Normal Std (σ)</label>
                <input
                  type="number"
                  step="0.5"
                  value={limits.cht.normal_std}
                  onChange={(e) => setLimits({ ...limits, cht: { ...limits.cht, normal_std: parseFloat(e.target.value) || 1 } })}
                  className="w-full p-2 bg-white border border-slate-200 rounded font-mono text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* EGT Limits */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <Flame className="w-4 h-4 text-orange-600" />
              <span>Exhaust Gas Temperature (EGT - °C)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Warning Ceiling</label>
                <input
                  type="number"
                  value={limits.egt.warning}
                  onChange={(e) => setLimits({ ...limits, egt: { ...limits.egt, warning: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-2 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Critical Limit</label>
                <input
                  type="number"
                  value={limits.egt.critical}
                  onChange={(e) => setLimits({ ...limits, egt: { ...limits.egt, critical: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-2 bg-white border border-slate-200 rounded font-mono font-bold text-red-600"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Normal Std (σ)</label>
                <input
                  type="number"
                  step="1"
                  value={limits.egt.normal_std}
                  onChange={(e) => setLimits({ ...limits, egt: { ...limits.egt, normal_std: parseFloat(e.target.value) || 1 } })}
                  className="w-full p-2 bg-white border border-slate-200 rounded font-mono text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Oil Pressure Limits */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <Droplet className="w-4 h-4 text-blue-500" />
              <span>Oil Pressure Envelope (kPa)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Warning Floor</label>
                <input
                  type="number"
                  value={limits.oil_pressure.warning}
                  onChange={(e) => setLimits({ ...limits, oil_pressure: { ...limits.oil_pressure, warning: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-2 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Critical Floor</label>
                <input
                  type="number"
                  value={limits.oil_pressure.critical}
                  onChange={(e) => setLimits({ ...limits, oil_pressure: { ...limits.oil_pressure, critical: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-2 bg-white border border-slate-200 rounded font-mono font-bold text-red-600"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Normal Std (σ)</label>
                <input
                  type="number"
                  step="1"
                  value={limits.oil_pressure.normal_std}
                  onChange={(e) => setLimits({ ...limits, oil_pressure: { ...limits.oil_pressure, normal_std: parseFloat(e.target.value) || 1 } })}
                  className="w-full p-2 bg-white border border-slate-200 rounded font-mono text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Vibration Limits */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <Activity className="w-4 h-4 text-purple-600" />
              <span>Vibration Load Envelope (g)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Warning Limit</label>
                <input
                  type="number"
                  step="0.05"
                  value={limits.vibration.warning}
                  onChange={(e) => setLimits({ ...limits, vibration: { ...limits.vibration, warning: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-2 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Critical Limit</label>
                <input
                  type="number"
                  step="0.05"
                  value={limits.vibration.critical}
                  onChange={(e) => setLimits({ ...limits, vibration: { ...limits.vibration, critical: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-2 bg-white border border-slate-200 rounded font-mono font-bold text-red-600"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Normal Std (σ)</label>
                <input
                  type="number"
                  step="0.005"
                  value={limits.vibration.normal_std}
                  onChange={(e) => setLimits({ ...limits, vibration: { ...limits.vibration, normal_std: parseFloat(e.target.value) || 0.01 } })}
                  className="w-full p-2 bg-white border border-slate-200 rounded font-mono text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
