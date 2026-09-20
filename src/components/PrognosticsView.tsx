import React from "react";
import {
  Clock,
  ShieldAlert,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  FileText,
  BarChart3,
  TrendingDown,
  Info,
  ChevronRight,
  Flame,
  Droplet,
  Zap,
  Sparkles
} from "lucide-react";
import { DigitalTwinState, TelemetrySample, EngineProfile } from "../types";

interface PrognosticsViewProps {
  twin: DigitalTwinState;
  telemetry: TelemetrySample;
  profile: EngineProfile;
  onOpenAiAdvisory: () => void;
  activeFault: string;
}

export const PrognosticsView: React.FC<PrognosticsViewProps> = ({
  twin,
  telemetry,
  profile,
  onOpenAiAdvisory,
  activeFault
}) => {
  const getSeverityBadge = (prob: number) => {
    if (prob >= 0.7) return "bg-red-50 text-red-700 border-red-200";
    if (prob >= 0.35) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Mission Reliability Evidence Box */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                AeroTwin Multi-Layer Prognostics & Health Management (PHM)
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                SIH26054 ML Architecture
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Combines physics-based regime residuals (Layer 1/2), statistical anomaly scores, multi-label fault classification (Layer 3), and Weibull survival RUL modeling with confidence intervals (Layer 4).
            </p>
          </div>

          <button
            onClick={onOpenAiAdvisory}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Engineering Work Order</span>
          </button>
        </div>

        {/* Hackathon Evidence Panel Callout (Matching Example in Prompt) */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <span className="font-mono text-blue-400 font-semibold uppercase tracking-wider">
              Advisory Prognostics Telemetry Synthesis
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Confidence: {Math.round(twin.confidence * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 text-xs">
            <div>
              <div className="text-slate-400 text-[11px]">Mission Reliability:</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                {twin.mission_reliability}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Remaining sortie: <span className="font-mono text-slate-200">{twin.remaining_mission_hours} hours</span>
              </div>
            </div>

            <div>
              <div className="text-slate-400 text-[11px]">Estimated Remaining Life:</div>
              <div className="text-2xl font-bold font-mono text-blue-400 mt-0.5">
                {twin.rul_hours} hrs
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                P10: {twin.rul_uncertainty.p10_hours}h | P90: {twin.rul_uncertainty.p90_hours}h
              </div>
            </div>

            <div>
              <div className="text-slate-400 text-[11px]">Primary Risk Indicator:</div>
              <div className="text-sm font-semibold text-amber-300 mt-1 line-clamp-1">
                {twin.primary_risk}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Composite Anomaly Score: <span className="font-mono text-slate-200">{twin.anomaly_score}</span>
              </div>
            </div>

            <div>
              <div className="text-slate-400 text-[11px]">Urgency / Action:</div>
              <div className="text-sm font-semibold text-white mt-1 line-clamp-1">
                {twin.maintenance_action.title}
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5 font-mono">
                {twin.maintenance_action.ata_chapter}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column: Fault Classification & Sensor Attribution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Layer 3: Fault Classification Probabilities */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                <span>Layer 3: Multi-Label Fault Mode Classification</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Trained gradient boosted classifier isolating probable failure mechanisms
              </p>
            </div>
            <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold">
              XGBoost Engine
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              {
                id: "lubrication_failure",
                label: "Lubrication Subsystem Failure",
                prob: twin.fault_probabilities.lubrication_failure,
                desc: "Loss of hydrodynamic film pressure, pump cavitation, dry-sump relief valve leak",
                icon: Droplet,
                color: "bg-blue-600"
              },
              {
                id: "overheating",
                label: "Thermal Overheating / Cylinder Scorching",
                prob: twin.fault_probabilities.overheating,
                desc: "Airflow baffle dislodgement, lean burn fuel mixture, cooling passage blockage",
                icon: Flame,
                color: "bg-orange-500"
              },
              {
                id: "bearing_degradation",
                label: "Mechanical Bearing Raceway Spalling",
                prob: twin.fault_probabilities.bearing_degradation,
                desc: "High 1X/2X shaft order vibration harmonics, unbalanced rotor, mount dampening fatigue",
                icon: Activity,
                color: "bg-purple-600"
              },
              {
                id: "combustion_instability",
                label: "Combustion Chamber Instability",
                prob: twin.fault_probabilities.combustion_instability,
                desc: "Injector nozzle clogging, ignition jitter, fluctuating EGT gradient",
                icon: Zap,
                color: "bg-yellow-500"
              }
            ].map((f) => {
              const Icon = f.icon;
              const probPct = Math.round(f.prob * 100);
              return (
                <div key={f.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                      <span>{f.label}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${getSeverityBadge(f.prob)}`}>
                      {probPct}% Probability
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 mb-2">{f.desc}</p>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${f.color}`}
                      style={{ width: `${Math.min(100, Math.max(4, probPct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Layer 2: Sensor Residuals & Top Contributing Features (SHAP Attribution) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Layer 2: Sensor Residuals & Feature Attribution</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Regime-aware variance (Actual vs Expected) normalized by standard deviation ($z = \Delta / \sigma$)
              </p>
            </div>
            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
              Residual Z-Score
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {twin.top_contributing_sensors.map((s) => {
              const isSignificant = Math.abs(s.z_score) > 2.0;
              return (
                <div key={s.sensor} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800">{s.label}</span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-slate-500">Residual: {s.residual > 0 ? `+${s.residual}` : s.residual}</span>
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded ${
                          isSignificant ? "bg-red-50 text-red-700 font-bold border border-red-200" : "text-slate-700 bg-slate-100"
                        }`}
                      >
                        {s.z_score > 0 ? `+${s.z_score}σ` : `${s.z_score}σ`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-slate-400 w-24">Risk Attribution:</span>
                    <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          s.importance > 60 ? "bg-red-500" : s.importance > 30 ? "bg-amber-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, s.importance))}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 font-semibold w-8 text-right">
                      {s.importance}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RUL Uncertainty Distribution & Recommended Maintenance Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* RUL Uncertainty Distribution Curve Card */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Layer 4: RUL Probability Density & Uncertainty Bounds</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Weibull survival cumulative failure distribution incorporating degradation trajectory
              </p>
            </div>
            <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">
              90% CI Bracket
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">P10 Conservative</span>
                <div className="text-lg font-bold font-mono text-slate-800">
                  {twin.rul_uncertainty.p10_hours} hrs
                </div>
                <div className="text-[10px] text-slate-500">90% chance survives past</div>
              </div>

              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-blue-600">P50 Median Estimate</span>
                <div className="text-2xl font-black font-mono text-blue-600">
                  {twin.rul_uncertainty.p50_hours} hrs
                </div>
                <div className="text-[10px] text-slate-500">Expected failure midpoint</div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-400">P90 Optimistic</span>
                <div className="text-lg font-bold font-mono text-slate-800">
                  {twin.rul_uncertainty.p90_hours} hrs
                </div>
                <div className="text-[10px] text-slate-500">Upper confidence bound</div>
              </div>
            </div>

            {/* Visual Interval Bar */}
            <div className="relative pt-2 pb-6">
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full opacity-30"
                  style={{ width: "80%" }}
                />
              </div>

              <div
                className="absolute top-1 w-3 h-5 bg-blue-600 rounded-sm -ml-1.5 shadow-xs"
                style={{ left: "50%" }}
              />

              <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
                <span>0 hrs (Immediate)</span>
                <span className="text-blue-600 font-bold">P50: {twin.rul_hours}h</span>
                <span>300+ hrs (Fresh Engine)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Action Directive */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>Action Directive</span>
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                  twin.maintenance_action.urgency === "CRITICAL"
                    ? "bg-red-600 text-white"
                    : twin.maintenance_action.urgency === "IMMEDIATE"
                    ? "bg-orange-500 text-white"
                    : twin.maintenance_action.urgency === "ELEVATED"
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {twin.maintenance_action.urgency}
              </span>
            </div>

            <h4 className="font-bold text-sm text-slate-900 mt-1">
              {twin.maintenance_action.title}
            </h4>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              {twin.maintenance_action.recommendation}
            </p>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Standard: {twin.maintenance_action.ata_chapter}</span>
              <span>Eng: {profile.id}</span>
            </div>
          </div>

          <button
            onClick={onOpenAiAdvisory}
            className="w-full mt-4 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Official Maintenance Form</span>
          </button>
        </div>
      </div>
    </div>
  );
};
