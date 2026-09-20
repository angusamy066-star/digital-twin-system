import React from "react";
import {
  Activity,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap,
  Flame,
  Droplet,
  Compass,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Cpu,
  CheckCircle2,
  Sparkles,
  Play,
  RotateCcw,
  Layers,
  Thermometer
} from "lucide-react";
import {
  DigitalTwinState,
  TelemetrySample,
  FaultType,
  EngineProfile,
  MissionInfo
} from "../types";

interface DashboardViewProps {
  telemetry: TelemetrySample;
  twin: DigitalTwinState;
  activeFault: FaultType;
  onInjectFault: (fault: FaultType) => void;
  activeProfile: EngineProfile;
  activeMission: MissionInfo;
  onNavigateTab: (tab: string) => void;
  onOpenAiAdvisory: () => void;
  onAcknowledgeAlert: (alertId: string) => void;
  validatedMode: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  telemetry,
  twin,
  activeFault,
  onInjectFault,
  activeProfile,
  activeMission,
  onNavigateTab,
  onOpenAiAdvisory,
  onAcknowledgeAlert,
  validatedMode
}) => {
  const getHealthColor = (val: number) => {
    if (val >= 85) return "text-emerald-600";
    if (val >= 65) return "text-amber-500";
    return "text-red-500";
  };

  const getHealthBg = (val: number) => {
    if (val >= 85) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (val >= 65) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  return (
    <div className="space-y-5">
      {/* Top Advisory Banner (Explicit Demo vs Validated Distinction) */}
      <div
        className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
          validatedMode
            ? "bg-blue-50/80 border-blue-200 text-blue-900"
            : "bg-amber-50/80 border-amber-200 text-amber-900"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${
              validatedMode ? "bg-blue-600 text-white" : "bg-amber-600 text-white"
            }`}
          >
            {validatedMode ? "VALIDATED MODE" : "DEMO MODE"}
          </span>
          <span className="font-medium">
            {validatedMode
              ? "Calibrated using DRDO approved engine operating envelopes & physical testbed records."
              : "Operating with synthetic telemetry & heuristic prognostics. Advisory only — not for flight-critical control."}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAiAdvisory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold text-slate-800 hover:bg-slate-50 transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Propulsion Advisory</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Fleet / Mission Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Engine Health Score */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium uppercase tracking-wide">Overall Health Score</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono ${getHealthColor(twin.health_score)}`}>
              {twin.health_score}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {twin.health_score >= 85 ? "Optimal" : twin.health_score >= 65 ? "Degrading" : "Critical"}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                twin.health_score >= 85 ? "bg-emerald-500" : twin.health_score >= 65 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${twin.health_score}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
            <span>Floor: 65%</span>
            <span>Anomaly: {twin.anomaly_score}</span>
          </div>
        </div>

        {/* KPI 2: Estimated Remaining Useful Life (RUL) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium uppercase tracking-wide">Estimated RUL (P50)</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900">
              {twin.rul_hours}
            </span>
            <span className="text-xs text-slate-500 font-medium">Operating Hours</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs bg-slate-50 p-1.5 rounded-lg border border-slate-100 font-mono text-slate-600">
            <span>P10: {twin.rul_uncertainty.p10_hours}h</span>
            <span className="font-bold text-slate-900">P50: {twin.rul_uncertainty.p50_hours}h</span>
            <span>P90: {twin.rul_uncertainty.p90_hours}h</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5">
            Confidence: <span className="font-semibold text-slate-700">{Math.round(twin.confidence * 100)}%</span> (Weibull hazard fit)
          </div>
        </div>

        {/* KPI 3: Mission Reliability */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium uppercase tracking-wide">Mission Reliability</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono ${getHealthColor(twin.mission_reliability)}`}>
              {twin.mission_reliability}%
            </span>
            <span className="text-xs text-slate-500 font-medium">Probability</span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            <div className="font-medium text-slate-800 line-clamp-1">
              Risk: {twin.primary_risk}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Remaining flight time: <span className="font-mono font-semibold">{twin.remaining_mission_hours} hrs</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5">
            Mission: <span className="font-semibold text-slate-700">{activeMission.name}</span>
          </div>
        </div>

        {/* KPI 4: Active Alerts & Fault Status */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium uppercase tracking-wide">Advisory Warnings</span>
            <AlertTriangle className={`w-4 h-4 ${twin.alerts.length > 0 ? "text-amber-500" : "text-slate-400"}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold font-mono ${
                twin.alerts.some((a) => a.severity === "critical")
                  ? "text-red-600"
                  : twin.alerts.length > 0
                  ? "text-amber-600"
                  : "text-emerald-600"
              }`}
            >
              {twin.alerts.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {twin.alerts.length === 0 ? "All Clear" : "Active Alerts"}
            </span>
          </div>
          <div className="mt-2 text-xs">
            {twin.alerts.length > 0 ? (
              <div className="text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200 font-medium text-[11px] truncate">
                {twin.alerts[0].message}
              </div>
            ) : (
              <div className="text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-200 font-medium text-[11px]">
                No limit violations detected
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
            <span>Airframe: {activeProfile.airframe}</span>
            <span>ENG: {activeProfile.id}</span>
          </div>
        </div>
      </div>

      {/* Hackathon Controlled Fault Injection Testbed Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Controlled Fault Injection Simulator (Hackathon Demo Testbed)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inject real-time physical degradation to observe digital twin state transitions, residual shifts, and RUL decay.
            </p>
          </div>
          {activeFault !== "none" && (
            <button
              onClick={() => onInjectFault("none")}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Nominal Cruise</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { id: "none" as FaultType, label: "Nominal Cruise", desc: "Stable parameters", icon: CheckCircle2, color: "hover:border-emerald-500" },
            { id: "overheat" as FaultType, label: "Overheat Load", desc: "CHT +45°C / EGT rise", icon: Flame, color: "hover:border-orange-500" },
            { id: "oil_pressure" as FaultType, label: "Oil Pressure Drop", desc: "Sump pressure -210 kPa", icon: Droplet, color: "hover:border-red-500" },
            { id: "vibration" as FaultType, label: "Vibration Spike", desc: "Bearing imbalance >0.65g", icon: Activity, color: "hover:border-purple-500" },
            { id: "combustion" as FaultType, label: "Combustion Swing", desc: "EGT & RPM instability", icon: Zap, color: "hover:border-yellow-500" },
            { id: "sensor_dropout" as FaultType, label: "Sensor Dropout", desc: "Lost channel & noise", icon: AlertTriangle, color: "hover:border-slate-500" }
          ].map((f) => {
            const isSelected = activeFault === f.id;
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                onClick={() => onInjectFault(f.id)}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? "bg-blue-50/90 border-blue-600 ring-1 ring-blue-600 shadow-xs"
                    : `bg-slate-50 border-slate-200 ${f.color} hover:bg-slate-100`
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-blue-600" : "text-slate-500"}`} />
                    {f.label}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  )}
                </div>
                <div className="text-[10px] text-slate-500">
                  {f.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Telemetry Stream KPI Cards */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-slate-900 text-sm">
              Real-Time Telemetry Feed (1 Hz Live Ingestion)
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab("live")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Open Advanced Multi-Chart Monitor</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-center">
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] uppercase font-semibold text-slate-400">RPM</div>
            <div className="font-mono font-bold text-base text-slate-900 mt-0.5">{telemetry.rpm}</div>
            <div className="text-[9px] text-slate-500">Normal ~2380</div>
          </div>

          <div className={`p-2.5 rounded-lg border ${telemetry.cht_c > 180 ? "bg-amber-50 border-amber-300" : "bg-slate-50 border-slate-200"}`}>
            <div className="text-[10px] uppercase font-semibold text-slate-400">CHT (°C)</div>
            <div className={`font-mono font-bold text-base mt-0.5 ${telemetry.cht_c > 180 ? "text-amber-600" : "text-slate-900"}`}>
              {telemetry.cht_c}
            </div>
            <div className="text-[9px] text-slate-500">Limit 180°C</div>
          </div>

          <div className={`p-2.5 rounded-lg border ${telemetry.egt_c > 760 ? "bg-amber-50 border-amber-300" : "bg-slate-50 border-slate-200"}`}>
            <div className="text-[10px] uppercase font-semibold text-slate-400">EGT (°C)</div>
            <div className={`font-mono font-bold text-base mt-0.5 ${telemetry.egt_c > 760 ? "text-amber-600" : "text-slate-900"}`}>
              {telemetry.egt_c}
            </div>
            <div className="text-[9px] text-slate-500">Limit 760°C</div>
          </div>

          <div className={`p-2.5 rounded-lg border ${telemetry.oil_pressure_kpa < 350 ? "bg-red-50 border-red-300" : "bg-slate-50 border-slate-200"}`}>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Oil Press (kPa)</div>
            <div className={`font-mono font-bold text-base mt-0.5 ${telemetry.oil_pressure_kpa < 350 ? "text-red-600" : "text-slate-900"}`}>
              {telemetry.oil_pressure_kpa < 0 ? "DROPOUT" : Math.round(telemetry.oil_pressure_kpa)}
            </div>
            <div className="text-[9px] text-slate-500">Floor 350 kPa</div>
          </div>

          <div className={`p-2.5 rounded-lg border ${telemetry.vibration_g > 0.40 ? "bg-purple-50 border-purple-300" : "bg-slate-50 border-slate-200"}`}>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Vibration (g)</div>
            <div className={`font-mono font-bold text-base mt-0.5 ${telemetry.vibration_g > 0.40 ? "text-purple-600" : "text-slate-900"}`}>
              {telemetry.vibration_g.toFixed(2)}
            </div>
            <div className="text-[9px] text-slate-500">Warn 0.40g</div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Fuel (L/h)</div>
            <div className="font-mono font-bold text-base text-slate-900 mt-0.5">{telemetry.fuel_flow_lph}</div>
            <div className="text-[9px] text-slate-500">Cruise ~18.0</div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Altitude (m)</div>
            <div className="font-mono font-bold text-base text-slate-900 mt-0.5">{telemetry.altitude_m}</div>
            <div className="text-[9px] text-slate-500">Flight Level 32</div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Throttle</div>
            <div className="font-mono font-bold text-base text-slate-900 mt-0.5">{telemetry.throttle_percent}%</div>
            <div className="text-[9px] text-slate-500">Cruising Mode</div>
          </div>
        </div>
      </div>

      {/* Lower Row: Active Warnings List & Subsystems Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Alerts Panel */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Active Warnings & Critical Alerts Log</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Auto-Evaluated Against Engine Profile Limits
            </span>
          </div>

          {twin.alerts.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
              <div className="font-semibold text-slate-700 text-sm">Nominal Flight Conditions</div>
              <div className="text-xs max-w-sm mt-1">
                All physical propulsion sensors and residual variance are within calibrated safe margins.
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {twin.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs ${
                    alert.severity === "critical"
                      ? "bg-red-50/80 border-red-200 text-red-900"
                      : "bg-amber-50/80 border-amber-200 text-amber-900"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        alert.severity === "critical"
                          ? "bg-red-600 text-white"
                          : "bg-amber-600 text-white"
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">{alert.message}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        Time: {alert.timestamp} | Type: {alert.type}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onAcknowledgeAlert(alert.id)}
                    className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition text-[11px] shadow-2xs whitespace-nowrap"
                  >
                    Acknowledge
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3D Quick Twin Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>3D Digital Twin Hub</span>
              </h3>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                Blender CAD
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Interactive 3D exploded disassembly view with component health glows, orthographic cameras, and parts inspection.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Primary Risk Factor:</span>
                <span className="font-medium text-slate-800 text-right truncate max-w-[140px]">{twin.primary_risk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recommended Action:</span>
                <span className="font-medium text-slate-800 text-right truncate max-w-[140px]">{twin.maintenance_action.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Urgency Level:</span>
                <span className={`font-bold ${twin.maintenance_action.urgency === "CRITICAL" ? "text-red-600" : "text-amber-600"}`}>
                  {twin.maintenance_action.urgency}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("twin")}
            className="w-full mt-4 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>Launch Fullscreen 3D Twin Viewport</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
