import React from "react";
import {
  Compass,
  Activity,
  AlertTriangle,
  Sparkles,
  Shield,
  Plane,
  ChevronDown
} from "lucide-react";
import { EngineProfile, MissionInfo, DigitalTwinState } from "../types";
import { DEFAULT_PROFILES } from "../services/engineProfiles";

interface HeaderProps {
  activeProfile: EngineProfile;
  onSelectProfile: (profile: EngineProfile) => void;
  activeMission: MissionInfo;
  twin: DigitalTwinState;
  validatedMode: boolean;
  onToggleValidatedMode: (enabled: boolean) => void;
  onOpenAiAdvisory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeProfile,
  onSelectProfile,
  activeMission,
  twin,
  validatedMode,
  onToggleValidatedMode,
  onOpenAiAdvisory
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 px-4 lg:px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Product Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-900/30">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white">
                AeroTwin
              </h1>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-[10px] font-bold border border-blue-500/30">
                SIH26054
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Engine Health & Mission Reliability Digital Twin
            </p>
          </div>
        </div>

        {/* Center: Mission & Engine Selector */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Active Mission Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700">
            <Plane className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-300 font-medium">
              {activeMission.id}
            </span>
            <span className="text-slate-500">|</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {activeMission.phase}
            </span>
          </div>

          {/* Engine Selector */}
          <div className="relative">
            <select
              value={activeProfile.id}
              onChange={(e) => {
                const found = DEFAULT_PROFILES.find((p) => p.id === e.target.value);
                if (found) onSelectProfile(found);
              }}
              className="appearance-none bg-slate-800 text-slate-200 border border-slate-700 rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {DEFAULT_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} — {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right: Mode Badge, Health Pill, & AI Action */}
        <div className="flex items-center gap-2.5 text-xs">
          {/* Mode Switcher */}
          <button
            onClick={() => onToggleValidatedMode(!validatedMode)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${
              validatedMode
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-amber-600/90 text-white"
            }`}
            title="Click to switch between Demo Heuristic and Validated mode"
          >
            {validatedMode ? "Validated" : "Demo Mode"}
          </button>

          {/* Health Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-lg border border-slate-700 font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                twin.health_score >= 85
                  ? "bg-emerald-500 animate-pulse"
                  : twin.health_score >= 65
                  ? "bg-amber-500 animate-pulse"
                  : "bg-red-500 animate-ping"
              }`}
            />
            <span className="text-slate-400">Health:</span>
            <span
              className={`font-bold ${
                twin.health_score >= 85
                  ? "text-emerald-400"
                  : twin.health_score >= 65
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {twin.health_score}%
            </span>
          </div>

          {/* Gemini AI Action */}
          <button
            onClick={onOpenAiAdvisory}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Advisory</span>
          </button>
        </div>
      </div>
    </header>
  );
};
