import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid
} from "recharts";
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Flame,
  Droplet,
  Activity,
  Gauge,
  Sliders,
  AlertCircle
} from "lucide-react";
import { TelemetrySample, EngineProfile, DigitalTwinState } from "../types";

interface LiveMonitorViewProps {
  history: TelemetrySample[];
  latest: TelemetrySample;
  twin: DigitalTwinState;
  profile: EngineProfile;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  streamRateHz: number;
  onChangeStreamRate: (rate: number) => void;
}

export const LiveMonitorView: React.FC<LiveMonitorViewProps> = ({
  history,
  latest,
  twin,
  profile,
  isStreaming,
  onToggleStreaming,
  streamRateHz,
  onChangeStreamRate
}) => {
  const [windowSize, setWindowSize] = useState<number>(60);
  const [selectedGroup, setSelectedGroup] = useState<"all" | "thermal" | "dynamics" | "pressures">("all");

  const limits = profile.limits;
  const recentSamples = history.slice(-windowSize);

  // Format data for recharts
  const chartData = recentSamples.map((s, idx) => ({
    timeIndex: idx - recentSamples.length + 1,
    timeLabel: s.timestamp ? s.timestamp.split("T")[1]?.slice(0, 8) : `${idx}s`,
    rpm: s.rpm,
    cht: s.cht_c,
    egt: s.egt_c,
    oilPressure: s.oil_pressure_kpa < 0 ? null : s.oil_pressure_kpa,
    oilTemp: s.oil_temperature_c,
    vibration: s.vibration_g,
    fuelFlow: s.fuel_flow_lph,
    altitude: s.altitude_m,
    throttle: s.throttle_percent
  }));

  const handleExportCSV = () => {
    if (history.length === 0) return;
    const headers = [
      "timestamp",
      "engine_id",
      "mission_id",
      "rpm",
      "cht_c",
      "egt_c",
      "oil_pressure_kpa",
      "oil_temperature_c",
      "vibration_g",
      "fuel_flow_lph",
      "altitude_m",
      "throttle_percent"
    ];
    const rows = history.map((s) => [
      s.timestamp,
      s.engine_id,
      s.mission_id,
      s.rpm,
      s.cht_c,
      s.egt_c,
      s.oil_pressure_kpa,
      s.oil_temperature_c,
      s.vibration_g,
      s.fuel_flow_lph,
      s.altitude_m,
      s.throttle_percent
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aerotwin_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Stream Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-xs text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <Gauge className="w-4 h-4 text-blue-600" />
            <span>High-Frequency Telemetry Ingestion</span>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono font-medium border border-emerald-200">
            <span className={`w-2 h-2 rounded-full bg-emerald-500 ${isStreaming ? "animate-pulse" : ""}`} />
            {isStreaming ? `ONLINE (${streamRateHz} Hz)` : "STREAM PAUSED"}
          </span>
          <span className="text-slate-400">Total Samples: {history.length}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Stream Rate Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {[1, 2, 5].map((rate) => (
              <button
                key={rate}
                onClick={() => onChangeStreamRate(rate)}
                className={`px-2 py-1 rounded font-medium transition ${
                  streamRateHz === rate ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {rate} Hz
              </button>
            ))}
          </div>

          {/* Rolling Window Size */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {[30, 60, 120].map((size) => (
              <button
                key={size}
                onClick={() => setWindowSize(size)}
                className={`px-2 py-1 rounded font-medium transition ${
                  windowSize === size ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {size}s Window
              </button>
            ))}
          </div>

          {/* Pause / Resume */}
          <button
            onClick={onToggleStreaming}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition shadow-xs ${
              isStreaming
                ? "bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isStreaming ? "Pause Stream" : "Resume Stream"}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grid of Telemetry Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart 1: RPM & Throttle Dynamics */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                <span>RPM & Throttle Position</span>
              </h4>
              <span className="text-[11px] text-slate-400">Mechanical shaft frequency & commanded duty</span>
            </div>
            <div className="text-right font-mono">
              <span className="font-bold text-slate-900 text-sm">{latest.rpm}</span>
              <span className="text-slate-400 text-xs"> RPM</span>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", fontSize: "11px", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="rpm" stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 border-t border-slate-100 pt-1">
            <span>Throttle: {latest.throttle_percent}%</span>
            <span>Max Continuous: {limits.rpm.max_continuous} RPM</span>
          </div>
        </div>

        {/* Chart 2: Cylinder Head Temperature (CHT) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Cylinder Head Temperature (CHT)</span>
              </h4>
              <span className="text-[11px] text-slate-400">Combustion chamber thermal gradient</span>
            </div>
            <div className="text-right font-mono">
              <span className={`font-bold text-sm ${latest.cht_c > limits.cht.warning ? "text-amber-600" : "text-slate-900"}`}>
                {latest.cht_c}
              </span>
              <span className="text-slate-400 text-xs"> °C</span>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis domain={[140, 230]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", fontSize: "11px", borderRadius: "8px" }} />
                <ReferenceLine y={limits.cht.warning} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `Warn ${limits.cht.warning}°C`, fill: "#d97706", fontSize: 9 }} />
                <ReferenceLine y={limits.cht.critical} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `Crit ${limits.cht.critical}°C`, fill: "#b91c1c", fontSize: 9 }} />
                <Line type="monotone" dataKey="cht" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 border-t border-slate-100 pt-1">
            <span>Ambient: {latest.ambient_temperature_c}°C</span>
            <span className={latest.cht_c > limits.cht.warning ? "text-amber-600 font-semibold" : ""}>
              Warning Limit: {limits.cht.warning}°C
            </span>
          </div>
        </div>

        {/* Chart 3: Exhaust Gas Temperature (EGT) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-600" />
                <span>Exhaust Gas Temperature (EGT)</span>
              </h4>
              <span className="text-[11px] text-slate-400">Mixture stoichiometry & combustion exhaust</span>
            </div>
            <div className="text-right font-mono">
              <span className={`font-bold text-sm ${latest.egt_c > limits.egt.warning ? "text-red-600" : "text-slate-900"}`}>
                {latest.egt_c}
              </span>
              <span className="text-slate-400 text-xs"> °C</span>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis domain={[650, 950]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", fontSize: "11px", borderRadius: "8px" }} />
                <ReferenceLine y={limits.egt.warning} stroke="#ea580c" strokeDasharray="3 3" label={{ value: `Warn ${limits.egt.warning}°C`, fill: "#c2410c", fontSize: 9 }} />
                <ReferenceLine y={limits.egt.critical} stroke="#b91c1c" strokeDasharray="3 3" label={{ value: `Crit ${limits.egt.critical}°C`, fill: "#7f1d1d", fontSize: 9 }} />
                <Line type="monotone" dataKey="egt" stroke="#ea580c" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 border-t border-slate-100 pt-1">
            <span>Normal Cruise: ~710°C</span>
            <span>Warning Ceiling: {limits.egt.warning}°C</span>
          </div>
        </div>

        {/* Chart 4: Oil Pressure */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-blue-500" />
                <span>Lubrication Oil Pressure (kPa)</span>
              </h4>
              <span className="text-[11px] text-slate-400">Dry-sump hydrodynamic journal pressure</span>
            </div>
            <div className="text-right font-mono">
              <span className={`font-bold text-sm ${latest.oil_pressure_kpa < limits.oil_pressure.warning ? "text-red-600" : "text-slate-900"}`}>
                {latest.oil_pressure_kpa < 0 ? "DROPOUT" : Math.round(latest.oil_pressure_kpa)}
              </span>
              <span className="text-slate-400 text-xs"> kPa</span>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis domain={[180, 500]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", fontSize: "11px", borderRadius: "8px" }} />
                <ReferenceLine y={limits.oil_pressure.warning} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `Warn ${limits.oil_pressure.warning} kPa`, fill: "#d97706", fontSize: 9 }} />
                <ReferenceLine y={limits.oil_pressure.critical} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `Floor ${limits.oil_pressure.critical} kPa`, fill: "#b91c1c", fontSize: 9 }} />
                <Line type="monotone" dataKey="oilPressure" stroke="#0284c7" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 border-t border-slate-100 pt-1">
            <span>Oil Temp: {latest.oil_temperature_c}°C</span>
            <span>Warning Floor: {limits.oil_pressure.warning} kPa</span>
          </div>
        </div>

        {/* Chart 5: Mechanical Vibration Load */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-600" />
                <span>Mechanical Vibration Load (g)</span>
              </h4>
              <span className="text-[11px] text-slate-400">Tri-axial accelerometer peak broadband amplitude</span>
            </div>
            <div className="text-right font-mono">
              <span className={`font-bold text-sm ${latest.vibration_g > limits.vibration.warning ? "text-purple-600" : "text-slate-900"}`}>
                {latest.vibration_g.toFixed(2)}
              </span>
              <span className="text-slate-400 text-xs"> g</span>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis domain={[0, 1.1]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", fontSize: "11px", borderRadius: "8px" }} />
                <ReferenceLine y={limits.vibration.warning} stroke="#a855f7" strokeDasharray="3 3" label={{ value: `Warn ${limits.vibration.warning}g`, fill: "#7e22ce", fontSize: 9 }} />
                <ReferenceLine y={limits.vibration.critical} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `Crit ${limits.vibration.critical}g`, fill: "#991b1b", fontSize: 9 }} />
                <Line type="monotone" dataKey="vibration" stroke="#9333ea" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 border-t border-slate-100 pt-1">
            <span>Nominal Rotor: ~0.22g</span>
            <span>Warning Limit: {limits.vibration.warning}g</span>
          </div>
        </div>

        {/* Chart 6: Fuel Flow & Power Consumption */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fuel Flow Rate (L/h) & Altitude</span>
              </h4>
              <span className="text-[11px] text-slate-400">Mass flow rate and barometric flight level</span>
            </div>
            <div className="text-right font-mono">
              <span className="font-bold text-sm text-slate-900">{latest.fuel_flow_lph}</span>
              <span className="text-slate-400 text-xs"> L/h</span>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis domain={[12, 28]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", fontSize: "11px", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="fuelFlow" stroke="#059669" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 border-t border-slate-100 pt-1">
            <span>Altitude: {latest.altitude_m} m</span>
            <span>Phase: {latest.mission_phase}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
