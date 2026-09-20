import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Upload,
  Clock,
  FastForward,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Layers,
  ChevronRight
} from "lucide-react";
import { TelemetrySample, DigitalTwinState, EngineProfile } from "../types";
import { computeDigitalTwin } from "../services/telemetryEngine";

interface ReplayViewProps {
  profile: EngineProfile;
  onSelectReplaySample: (sample: TelemetrySample, twin: DigitalTwinState) => void;
}

interface ReplayEvent {
  timeIndex: number;
  timeLabel: string;
  title: string;
  type: "takeoff" | "climb" | "fault" | "alert" | "rtb";
  desc: string;
}

export const ReplayView: React.FC<ReplayViewProps> = ({
  profile,
  onSelectReplaySample
}) => {
  // Generate a synthetic recorded sortie with an injected incident at frame 24
  const [frames, setFrames] = useState<TelemetrySample[]>(() => {
    const arr: TelemetrySample[] = [];
    const totalFrames = 60;
    for (let i = 0; i < totalFrames; i++) {
      const isFault = i >= 24;
      const faultProgress = isFault ? Math.min(1.0, (i - 24) / 18) : 0;

      const rpm = 2380 + Math.sin(i / 3) * 40;
      const cht = 165 + Math.sin(i / 5) * 5 + (isFault ? 48 * faultProgress : 0);
      const egt = 710 + Math.sin(i / 4) * 8 + (isFault ? 135 * faultProgress : 0);
      const oilP = 420 - (isFault ? 195 * faultProgress : 0);
      const vib = 0.22 + (isFault ? 0.62 * faultProgress : 0.01 * Math.sin(i / 2));

      arr.push({
        timestamp: new Date(Date.now() - (totalFrames - i) * 1000 * 30).toISOString(),
        engine_id: profile.id,
        mission_id: "MISSION-042",
        mission_phase: i < 5 ? "TAKEOFF" : i < 12 ? "CLIMB" : i > 50 ? "DESCENT" : "CRUISE",
        rpm: Math.round(rpm),
        cht_c: Math.round(cht * 10) / 10,
        egt_c: Math.round(egt * 10) / 10,
        oil_pressure_kpa: Math.round(oilP * 10) / 10,
        oil_temperature_c: Math.round((91 + (isFault ? 18 * faultProgress : 0)) * 10) / 10,
        vibration_g: Math.round(vib * 1000) / 1000,
        fuel_flow_lph: 18.2,
        altitude_m: i < 12 ? 800 + i * 200 : 3200,
        ambient_temperature_c: 19.4,
        throttle_percent: 64.2,
      });
    }
    return arr;
  });

  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(24);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const timelineEvents: ReplayEvent[] = [
    { timeIndex: 0, timeLabel: "00:00", title: "Takeoff Roll", type: "takeoff", desc: "Climb thrust 2450 RPM" },
    { timeIndex: 12, timeLabel: "06:00", title: "Cruise Level FL32", type: "climb", desc: "Stable cruise parameters" },
    { timeIndex: 24, timeLabel: "12:00", title: "Injected Oil Pump Degradation", type: "fault", desc: "Scavenge pressure decay begins" },
    { timeIndex: 32, timeLabel: "16:00", title: "Lubrication Warning Alarm", type: "alert", desc: "Pressure drops below 350 kPa" },
    { timeIndex: 48, timeLabel: "24:00", title: "Advisory Abort / RTB Commanded", type: "rtb", desc: "Mission reliability drops to 78%" }
  ];

  const currentSample = frames[currentFrameIdx] || frames[0];
  const currentTwin = computeDigitalTwin(currentSample, profile, 2.0);

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentFrameIdx((prev) => {
        if (prev >= frames.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, frames.length]);

  // Sync with parent when user scrubs
  useEffect(() => {
    if (currentSample) {
      onSelectReplaySample(currentSample, currentTwin);
    }
  }, [currentFrameIdx]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          const dataList = Array.isArray(parsed) ? parsed : [parsed];
          if (dataList.length > 0 && dataList[0].rpm !== undefined) {
            setFrames(dataList);
            setCurrentFrameIdx(0);
            setIsPlaying(false);
          }
        } else if (file.name.endsWith(".csv")) {
          const lines = text.split("\n").filter((l) => l.trim().length > 0);
          const headers = lines[0].split(",").map((h) => h.trim());
          const samples: TelemetrySample[] = [];

          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",").map((c) => c.trim());
            samples.push({
              timestamp: cols[0] || new Date().toISOString(),
              engine_id: cols[1] || profile.id,
              mission_id: cols[2] || "UPLOAD-01",
              mission_phase: "CRUISE",
              rpm: parseFloat(cols[3]) || 2380,
              cht_c: parseFloat(cols[4]) || 165,
              egt_c: parseFloat(cols[5]) || 710,
              oil_pressure_kpa: parseFloat(cols[6]) || 420,
              oil_temperature_c: parseFloat(cols[7]) || 91,
              vibration_g: parseFloat(cols[8]) || 0.22,
              fuel_flow_lph: parseFloat(cols[9]) || 18,
              altitude_m: parseFloat(cols[10]) || 3200,
              ambient_temperature_c: 19.4,
              throttle_percent: parseFloat(cols[11]) || 64,
            });
          }
          if (samples.length > 0) {
            setFrames(samples);
            setCurrentFrameIdx(0);
            setIsPlaying(false);
          }
        }
      } catch (err) {
        alert("Failed to parse telemetry file. Please upload a valid AeroTwin JSON or CSV.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5">
      {/* Header & Ingestion Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Historical Mission Replay & Blackbox Flight Ingestion</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Scrub recorded flight test datasets, inspect state transitions at milestone incident annotations, or upload custom DRDO sortie logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold text-xs text-slate-800 hover:bg-slate-50 transition shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Upload DRDO Log (.JSON / .CSV)</span>
          </button>
        </div>
      </div>

      {/* Scrub Controls Player */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setCurrentFrameIdx(0);
                setIsPlaying(false);
              }}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Restart from beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Playback speed buttons */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              {[1, 2, 5, 10].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-1 rounded font-mono font-medium ${
                    playbackSpeed === spd ? "bg-white text-blue-600 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-500">
              Frame: <span className="font-bold text-slate-900">{currentFrameIdx + 1}</span> / {frames.length}
            </span>
            <span className="text-slate-500">
              Phase: <span className="font-semibold text-blue-600">{currentSample.mission_phase}</span>
            </span>
            <span className="text-slate-500">
              Time: <span className="font-semibold text-slate-800">{currentSample.timestamp.split("T")[1]?.slice(0, 8)}</span>
            </span>
          </div>
        </div>

        {/* Timeline Slider with Milestone Pins */}
        <div className="relative py-2">
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            value={currentFrameIdx}
            onChange={(e) => {
              setCurrentFrameIdx(parseInt(e.target.value));
              setIsPlaying(false);
            }}
            className="w-full h-2.5 bg-slate-200 rounded-lg accent-blue-600 cursor-pointer"
          />

          {/* Event Pins on Timeline */}
          <div className="relative h-6 mt-1">
            {timelineEvents.map((evt) => {
              const pct = (evt.timeIndex / frames.length) * 100;
              const isActive = Math.abs(currentFrameIdx - evt.timeIndex) < 2;
              return (
                <button
                  key={evt.title}
                  onClick={() => {
                    setCurrentFrameIdx(evt.timeIndex);
                    setIsPlaying(false);
                  }}
                  className="absolute -top-1 transform -translate-x-1/2 flex flex-col items-center group cursor-pointer"
                  style={{ left: `${pct}%` }}
                >
                  <span
                    className={`w-3 h-3 rounded-full border-2 border-white shadow-xs transition ${
                      evt.type === "fault"
                        ? "bg-red-500 animate-pulse"
                        : evt.type === "alert"
                        ? "bg-amber-500"
                        : "bg-blue-600"
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-1 whitespace-nowrap hidden group-hover:block bg-slate-900 text-white px-1.5 py-0.5 rounded shadow-sm z-10">
                    {evt.timeLabel} - {evt.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Synchronized Twin Snapshot at Current Replay Frame */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Frame Telemetry Snapshot */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-xs text-slate-900 mb-2">Replay Frame Telemetry</h3>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-sans">RPM</span>
              <span className="font-bold text-slate-900">{currentSample.rpm}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-sans">CHT</span>
              <span className={`font-bold ${currentSample.cht_c > 180 ? "text-amber-600" : "text-slate-900"}`}>
                {currentSample.cht_c}°C
              </span>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-sans">EGT</span>
              <span className={`font-bold ${currentSample.egt_c > 760 ? "text-amber-600" : "text-slate-900"}`}>
                {currentSample.egt_c}°C
              </span>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-sans">Oil Press</span>
              <span className={`font-bold ${currentSample.oil_pressure_kpa < 350 ? "text-red-600" : "text-slate-900"}`}>
                {Math.round(currentSample.oil_pressure_kpa)} kPa
              </span>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-sans">Vibration</span>
              <span className={`font-bold ${currentSample.vibration_g > 0.40 ? "text-purple-600" : "text-slate-900"}`}>
                {currentSample.vibration_g}g
              </span>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-sans">Fuel Flow</span>
              <span className="font-bold text-slate-900">{currentSample.fuel_flow_lph} L/h</span>
            </div>
          </div>
        </div>

        {/* Digital Twin State at this point in time */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-xs text-slate-900 mb-2">Synchronized Twin Prognostics</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-600">Health Score:</span>
              <span className={`font-mono font-bold text-sm ${currentTwin.health_score < 70 ? "text-red-600" : "text-emerald-600"}`}>
                {currentTwin.health_score}%
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-600">Mission Reliability:</span>
              <span className="font-mono font-bold text-slate-900">{currentTwin.mission_reliability}%</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-600">Estimated RUL:</span>
              <span className="font-mono font-bold text-blue-600">{currentTwin.rul_hours} hrs</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-600">Anomaly Residual:</span>
              <span className="font-mono font-bold text-slate-700">{currentTwin.anomaly_score}</span>
            </div>
          </div>
        </div>

        {/* Milestone Event Checklist */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-xs text-slate-900 mb-2">Flight Event Log</h3>
          <div className="space-y-1.5 text-xs">
            {timelineEvents.map((evt) => (
              <button
                key={evt.title}
                onClick={() => {
                  setCurrentFrameIdx(evt.timeIndex);
                  setIsPlaying(false);
                }}
                className={`w-full p-2 rounded text-left transition flex items-start justify-between ${
                  currentFrameIdx >= evt.timeIndex
                    ? "bg-slate-50 text-slate-900 border border-slate-200"
                    : "opacity-40 text-slate-500"
                }`}
              >
                <div>
                  <div className="font-semibold text-[11px]">{evt.title}</div>
                  <div className="text-[10px] text-slate-500">{evt.desc}</div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{evt.timeLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
