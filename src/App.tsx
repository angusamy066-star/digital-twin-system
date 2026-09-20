import React, { useState, useEffect, useRef } from "react";
import {
  EngineProfile,
  MissionInfo,
  TelemetrySample,
  DigitalTwinState,
  FaultType
} from "./types";
import { DEFAULT_PROFILES, DEFAULT_MISSION } from "./services/engineProfiles";
import { generateSyntheticTelemetry, computeDigitalTwin } from "./services/telemetryEngine";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { DashboardView } from "./components/DashboardView";
import { DigitalTwin3DView } from "./components/DigitalTwin3DView";
import { LiveMonitorView } from "./components/LiveMonitorView";
import { PrognosticsView } from "./components/PrognosticsView";
import { ReplayView } from "./components/ReplayView";
import { EngineProfileSettings } from "./components/EngineProfileSettings";
import { AiAdvisoryModal } from "./components/AiAdvisoryModal";
import { ShieldCheck, Info } from "lucide-react";

export default function App() {
  // Engine & Mission State
  const [activeProfile, setActiveProfile] = useState<EngineProfile>(DEFAULT_PROFILES[0]);
  const [activeMission, setActiveMission] = useState<MissionInfo>(DEFAULT_MISSION);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [activeFault, setActiveFault] = useState<FaultType>("none");
  const [validatedMode, setValidatedMode] = useState<boolean>(false);

  // Streaming & Telemetry State
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [streamRateHz, setStreamRateHz] = useState<number>(1);
  const [timeStep, setTimeStep] = useState<number>(0);

  // AI Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Initial Seed Telemetry and Twin State
  const [currentTelemetry, setCurrentTelemetry] = useState<TelemetrySample>(() =>
    generateSyntheticTelemetry(activeProfile, activeMission, "none", 0)
  );

  const [twinState, setTwinState] = useState<DigitalTwinState>(() =>
    computeDigitalTwin(
      generateSyntheticTelemetry(activeProfile, activeMission, "none", 0),
      activeProfile,
      activeMission.duration_planned_hours - activeMission.elapsed_hours
    )
  );

  const [history, setHistory] = useState<TelemetrySample[]>(() => {
    const initialArr: TelemetrySample[] = [];
    for (let i = 40; i >= 0; i--) {
      initialArr.push(generateSyntheticTelemetry(activeProfile, activeMission, "none", -i));
    }
    return initialArr;
  });

  // Replay Selection (for viewing past frames)
  const [replaySample, setReplaySample] = useState<TelemetrySample | null>(null);
  const [replayTwin, setReplayTwin] = useState<DigitalTwinState | null>(null);

  // Real-time telemetry generator loop
  useEffect(() => {
    if (!isStreaming) return;

    const intervalMs = Math.max(200, 1000 / streamRateHz);
    const interval = setInterval(() => {
      setTimeStep((prevStep) => {
        const nextStep = prevStep + 1;
        const newSample = generateSyntheticTelemetry(
          activeProfile,
          activeMission,
          activeFault,
          nextStep
        );

        const newTwin = computeDigitalTwin(
          newSample,
          activeProfile,
          activeMission.duration_planned_hours - activeMission.elapsed_hours
        );

        setCurrentTelemetry(newSample);
        setTwinState(newTwin);
        setHistory((prevHistory) => {
          const updated = [...prevHistory, newSample];
          if (updated.length > 200) {
            return updated.slice(updated.length - 200);
          }
          return updated;
        });

        return nextStep;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isStreaming, streamRateHz, activeProfile, activeMission, activeFault]);

  // Acknowledge alert handler
  const handleAcknowledgeAlert = (alertId: string) => {
    setTwinState((prev) => ({
      ...prev,
      alerts: prev.alerts.filter((a) => a.id !== alertId)
    }));
  };

  // Switch to replay frame in 3D viewport or inspection
  const handleSelectReplaySample = (sample: TelemetrySample, twin: DigitalTwinState) => {
    setReplaySample(sample);
    setReplayTwin(twin);
  };

  // Effective telemetry for views (live or scrubbed replay)
  const displayTelemetry = activeTab === "replay" && replaySample ? replaySample : currentTelemetry;
  const displayTwin = activeTab === "replay" && replayTwin ? replayTwin : twinState;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white antialiased">
      {/* Top Application Header */}
      <Header
        activeProfile={activeProfile}
        onSelectProfile={(p) => {
          setActiveProfile(p);
          setTimeStep(0);
        }}
        activeMission={activeMission}
        twin={displayTwin}
        validatedMode={validatedMode}
        onToggleValidatedMode={setValidatedMode}
        onOpenAiAdvisory={() => setIsAiModalOpen(true)}
      />

      {/* Main Navigation Tab Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        alertCount={twinState.alerts.length}
      />

      {/* Main Workspace Area - Expands to wide CAD workstation width for 3D Digital Twin */}
      <main
        className={`flex-1 w-full mx-auto transition-all duration-300 ${
          activeTab === "twin"
            ? "max-w-[1760px] p-2 sm:p-4 md:p-6 space-y-4"
            : "max-w-7xl p-4 sm:p-6 space-y-6"
        }`}
      >
        {activeTab === "dashboard" && (
          <DashboardView
            telemetry={displayTelemetry}
            twin={displayTwin}
            activeFault={activeFault}
            onInjectFault={setActiveFault}
            activeProfile={activeProfile}
            activeMission={activeMission}
            onNavigateTab={setActiveTab}
            onOpenAiAdvisory={() => setIsAiModalOpen(true)}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            validatedMode={validatedMode}
          />
        )}

        {activeTab === "twin" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">
                  Interactive 3D Propulsion Digital Twin:
                </span>
                <span className="font-mono text-blue-600 font-semibold">
                  {activeProfile.name} ({activeProfile.id})
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500">
                  Status: <strong className={displayTwin.health_score < 70 ? "text-red-600" : "text-emerald-600"}>{displayTwin.health_score}% Health</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg transition"
                >
                  Diagnose Components with Gemini AI
                </button>
              </div>
            </div>

            <DigitalTwin3DView
              telemetry={displayTelemetry}
              twin={displayTwin}
              activeFault={activeFault}
              profile={activeProfile}
            />
          </div>
        )}

        {activeTab === "live" && (
          <LiveMonitorView
            history={history}
            latest={displayTelemetry}
            twin={displayTwin}
            profile={activeProfile}
            isStreaming={isStreaming}
            onToggleStreaming={() => setIsStreaming(!isStreaming)}
            streamRateHz={streamRateHz}
            onChangeStreamRate={setStreamRateHz}
          />
        )}

        {activeTab === "prognostics" && (
          <PrognosticsView
            twin={displayTwin}
            telemetry={displayTelemetry}
            profile={activeProfile}
            onOpenAiAdvisory={() => setIsAiModalOpen(true)}
            activeFault={activeFault}
          />
        )}

        {activeTab === "replay" && (
          <ReplayView
            profile={activeProfile}
            onSelectReplaySample={handleSelectReplaySample}
          />
        )}

        {activeTab === "settings" && (
          <EngineProfileSettings
            activeProfile={activeProfile}
            onUpdateProfile={setActiveProfile}
            onSelectProfile={setActiveProfile}
            validatedMode={validatedMode}
            onToggleValidatedMode={setValidatedMode}
          />
        )}
      </main>

      {/* Advisory & Compliance Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700">
              AeroTwin SIH26054 Platform
            </span>
            <span className="text-slate-400">•</span>
            <span>
              Advisory Monitoring & Mission Reliability Digital Twin
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-600">
              Advisory System Only — Not Certified For Direct Flight Control
            </span>
            <span className="text-slate-400 font-mono">
              v1.0.4 Production
            </span>
          </div>
        </div>
      </footer>

      {/* Gemini AI Propulsion Diagnostic Modal */}
      <AiAdvisoryModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        telemetry={displayTelemetry}
        twin={displayTwin}
        activeFault={activeFault}
        profile={activeProfile}
      />
    </div>
  );
}
