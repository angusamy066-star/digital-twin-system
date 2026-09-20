import React, { useState, useMemo, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import {
  RotateCcw,
  Grid,
  Layers,
  Play,
  Pause,
  AlertTriangle,
  Activity,
  Flame,
  Droplet,
  Zap,
  Scissors,
  Compass,
  Camera,
  Sun,
  Sparkles,
  RotateCw,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from "lucide-react";
import { ComponentHealth, DigitalTwinState, TelemetrySample, PartInfo, EngineProfile } from "../types";
import {
  TURBINE_PARTS_CATALOG,
  UAV_PARTS_CATALOG,
  BOXER_PARTS_CATALOG,
  getPartsCatalogForModel
} from "../services/engineProfiles";
import { StudioEnvironment, HdrPresetType } from "./3d/StudioEnvironment";
import { CameraController, ViewAngle } from "./3d/CameraController";
import { TurbineEngineModel } from "./3d/TurbineEngineModel";
import { UAVSkyfallModel } from "./3d/UAVSkyfallModel";
import { BoxerEngineModel } from "./3d/BoxerEngineModel";

interface DigitalTwin3DViewProps {
  telemetry: TelemetrySample;
  twin: DigitalTwinState;
  activeFault: string;
  profile?: EngineProfile;
}

type ModelType = "turbine" | "uav" | "boxer";
type RenderMode = "shaded" | "wireframe" | "thermal" | "xray";

export const DigitalTwin3DView: React.FC<DigitalTwin3DViewProps> = ({
  telemetry,
  twin,
  activeFault,
  profile
}) => {
  // Determine initial model type based on profile (Defaults to Hum3D Skyfall #001)
  const initialModelType = useMemo<ModelType>(() => {
    if (profile?.id === "ENG-003" || profile?.engine_type.includes("turboprop")) {
      return "turbine";
    }
    if (profile?.id === "ENG-002" || profile?.engine_type.includes("rotary")) {
      return "boxer";
    }
    return "uav";
  }, [profile?.id, profile?.engine_type]);

  const [activeModel, setActiveModel] = useState<ModelType>(initialModelType);
  const [explosionFactor, setExplosionFactor] = useState<number>(0.35); // 35% Exploded inspection default
  const [renderMode, setRenderMode] = useState<RenderMode>("shaded");
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showCutaway, setShowCutaway] = useState<boolean>(true); // 180° Cutaway view
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [animateRotation, setAnimateRotation] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<ViewAngle>("iso");
  const [selectedPartId, setSelectedPartId] = useState<string | null>(
    initialModelType === "turbine" ? "turb-2" : initialModelType === "uav" ? "uav-1" : "box-1"
  );

  // High-Resolution HDR Environment Map State (@react-three/drei)
  const [hdrPreset, setHdrPreset] = useState<HdrPresetType>("hangar");
  const [hdrIntensity, setHdrIntensity] = useState<number>(1.35); // Calibrated PBR metallic intensity
  const [hdrRotation, setHdrRotation] = useState<number>(0.45); // Specular highlight angle
  const [showHdrBackground, setShowHdrBackground] = useState<boolean>(false);

  // Active Parts Catalog for Component Explorer
  const activeCatalog: PartInfo[] = useMemo(() => {
    return getPartsCatalogForModel(activeModel);
  }, [activeModel]);

  const selectedPart = useMemo(() => {
    return activeCatalog.find((p) => p.id === selectedPartId) || null;
  }, [activeCatalog, selectedPartId]);

  // Viewport Sizing & Fullscreen Expand State
  const [viewportSizeMode, setViewportSizeMode] = useState<"standard" | "expanded" | "theater">("expanded");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showPartsTray, setShowPartsTray] = useState<boolean>(true);
  const [showHudOverlays, setShowHudOverlays] = useState<boolean>(true);

  // Listen for Escape key to exit fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Color helper for health
  const getHealthColor = (health: number) => {
    if (health >= 85) return "#10b981"; // Emerald nominal
    if (health >= 70) return "#84cc16"; // Lime
    if (health >= 55) return "#eab308"; // Amber caution
    if (health >= 35) return "#f97316"; // Orange warning
    return "#ef4444"; // Red critical
  };

  const getSubsystemHealth = (healthKey?: keyof ComponentHealth) => {
    if (!healthKey) return 92;
    return twin.component_health[healthKey] ?? 90;
  };

  const handleResetCamera = () => {
    setCurrentView("iso");
    setAutoRotate(false);
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-slate-950 flex flex-col h-screen w-screen overflow-hidden"
          : "bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full w-full"
      }`}
    >
      {/* Top 3D Control Ribbon Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Model Switcher Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300/80">
            <button
              onClick={() => {
                setActiveModel("turbine");
                setSelectedPartId("turb-2");
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1 ${
                activeModel === "turbine"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>🚀 Aero Turbine Core</span>
              <span className="text-[9px] px-1 rounded bg-blue-100 text-blue-700">Original</span>
            </button>
            <button
              onClick={() => {
                setActiveModel("uav");
                setSelectedPartId("uav-1");
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1.5 ${
                activeModel === "uav"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>🛸 Hum3D Skyfall #001</span>
              <span className="text-[9px] px-1 rounded bg-orange-100 text-orange-700 font-bold">
                VTOL Hexacopter
              </span>
            </button>
            <button
              onClick={() => {
                setActiveModel("boxer");
                setSelectedPartId("box-1");
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1 ${
                activeModel === "boxer"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>⚙️ Aero Boxer Piston</span>
            </button>
          </div>

          {activeFault !== "none" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              Fault: {activeFault}
            </span>
          )}
        </div>

        {/* Center: Camera Angle Presets */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {(["iso", "top", "front", "side", "rear", "cutaway"] as ViewAngle[]).map((ang) => (
            <button
              key={ang}
              onClick={() => setCurrentView(ang)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition capitalize ${
                currentView === ang
                  ? "bg-white text-blue-600 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {ang}
            </button>
          ))}
        </div>

        {/* Right: Render Modes & Interactive Features */}
        <div className="flex items-center gap-1.5">
          {/* 180° Cutaway Inspection Mode Toggle */}
          <button
            onClick={() => setShowCutaway(!showCutaway)}
            title="Toggle 180° Cutaway Inspection (Peer into internal blades & combustor)"
            className={`px-2.5 py-1 rounded text-[11px] font-medium border flex items-center gap-1.5 transition ${
              showCutaway
                ? "bg-blue-50 text-blue-700 border-blue-300 font-semibold"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-blue-600" />
            <span>Cutaway {showCutaway ? "ON" : "OFF"}</span>
          </button>

          {/* Shading mode selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setRenderMode("shaded")}
              title="Solid CAD with PBR Metallic Lighting"
              className={`px-2 py-1 rounded text-[11px] font-medium ${
                renderMode === "shaded"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Solid PBR
            </button>
            <button
              onClick={() => setRenderMode("wireframe")}
              title="Wireframe Mesh"
              className={`px-2 py-1 rounded text-[11px] font-medium ${
                renderMode === "wireframe"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Wireframe
            </button>
            <button
              onClick={() => setRenderMode("thermal")}
              title="Health Heatmap"
              className={`px-2 py-1 rounded text-[11px] font-medium ${
                renderMode === "thermal"
                  ? "bg-white text-emerald-700 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Health Tint
            </button>
            <button
              onClick={() => setRenderMode("xray")}
              title="X-Ray Ghost"
              className={`px-2 py-1 rounded text-[11px] font-medium ${
                renderMode === "xray"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              X-Ray
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* HDR Environment Presets */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-500" />
              <span className="hidden sm:inline">HDR:</span>
            </span>
            {(
              [
                { id: "hangar", label: "Hangar" },
                { id: "testcell", label: "Test Cell" },
                { id: "flightline", label: "Runway" },
                { id: "cleanroom", label: "Cleanroom" },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                onClick={() => setHdrPreset(preset.id)}
                title={`HDR Environment: ${preset.label} (1024px High-Res Drei Cubemap)`}
                className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                  hdrPreset === preset.id
                    ? "bg-white text-blue-600 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* HDR Specular Intensity Level */}
          <button
            onClick={() => {
              setHdrIntensity((prev) => {
                if (prev <= 1.05) return 1.45;
                if (prev <= 1.5) return 1.95;
                return 0.95;
              });
            }}
            title="Cycle HDR Specular Reflection Power on Metallic Components"
            className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[11px] font-medium flex items-center gap-1 shadow-2xs"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Reflect: {hdrIntensity >= 1.7 ? "1.9x (Gloss)" : hdrIntensity >= 1.3 ? "1.4x (Studio)" : "1.0x (Soft)"}</span>
          </button>

          {/* Shift HDR Reflection Angle */}
          <button
            onClick={() => setHdrRotation((prev) => (prev + Math.PI / 4) % (Math.PI * 2))}
            title="Shift HDR Specular Highlight Angle (Orbits environment map 45°)"
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Studio Grid */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Studio CAD Grid"
            className={`p-1.5 rounded border transition ${
              showGrid ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Turntable Auto Spin */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="Auto Turntable Spin"
            className={`p-1.5 rounded border transition ${
              autoRotate ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
          </button>

          {/* Shaft Rotation Dynamics */}
          <button
            onClick={() => setAnimateRotation(!animateRotation)}
            title="Live Shaft & Blade Rotation"
            className={`p-1.5 rounded border transition ${
              animateRotation ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {animateRotation ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Reset Camera */}
          <button
            onClick={handleResetCamera}
            title="Reset Viewport"
            className="p-1.5 rounded bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Toggle HUD specs overlays */}
          <button
            onClick={() => setShowHudOverlays(!showHudOverlays)}
            title={showHudOverlays ? "Hide HUD Overlays (Clean 3D CAD view)" : "Show HUD Overlays"}
            className={`p-1.5 rounded border transition flex items-center gap-1 ${
              showHudOverlays
                ? "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                : "bg-amber-50 text-amber-700 border-amber-300"
            }`}
          >
            {showHudOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="text-[10px] hidden xl:inline">{showHudOverlays ? "HUD" : "Clean"}</span>
          </button>

          {/* 3D Viewport Size Modes */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 hidden md:inline">
              Place Size:
            </span>
            {(
              [
                { id: "standard", label: "Std (680px)" },
                { id: "expanded", label: "Expanded (860px)" },
                { id: "theater", label: "Theater (1020px)" },
              ] as const
            ).map((size) => (
              <button
                key={size.id}
                onClick={() => setViewportSizeMode(size.id)}
                title={`Set 3D Viewport Dimension: ${size.label}`}
                className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                  viewportSizeMode === size.id && !isFullscreen
                    ? "bg-white text-blue-600 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>

          {/* Expand Fullscreen / Workstation Mode Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand 3D View to Fullscreen Workstation"}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border flex items-center gap-1.5 transition shadow-xs ${
              isFullscreen
                ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-md"
                : "bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
            }`}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Fullscreen</span>
                <span className="text-[9px] bg-amber-600/60 px-1 rounded font-mono">ESC</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Expand Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Area - Expansive Viewport Size */}
      <div
        className={`relative w-full transition-all duration-300 bg-[#f8fafc] ${
          isFullscreen
            ? "flex-1 h-full min-h-[500px]"
            : viewportSizeMode === "theater"
            ? "h-[940px] lg:h-[1000px] xl:h-[1040px]"
            : viewportSizeMode === "expanded"
            ? "h-[800px] lg:h-[860px] xl:h-[900px]"
            : "h-[660px] lg:h-[700px]"
        }`}
      >
        {/* React Three Fiber Canvas with PBR Studio Settings */}
        <Canvas
          shadows
          camera={{ position: [5.5, 3.8, 6.2], fov: 42 }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        >
          <Suspense fallback={null}>
            {/* High-Resolution PBR HDR Environment Map & Ground Shadows */}
            <StudioEnvironment
              showGrid={showGrid}
              hdrPreset={hdrPreset}
              hdrIntensity={hdrIntensity}
              hdrRotation={hdrRotation}
              showHdrBackground={showHdrBackground}
            />

            {/* Smooth Camera Controller */}
            <CameraController currentView={currentView} autoRotate={autoRotate} />

            {/* Active 3D Engine Model */}
            {activeModel === "turbine" && (
              <TurbineEngineModel
                telemetry={telemetry}
                twin={twin}
                explosionFactor={explosionFactor}
                showCutaway={showCutaway}
                animateRotation={animateRotation}
                renderMode={renderMode}
                selectedPartId={selectedPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
              />
            )}

            {activeModel === "uav" && (
              <UAVSkyfallModel
                telemetry={telemetry}
                twin={twin}
                explosionFactor={explosionFactor}
                showCutaway={showCutaway}
                animateRotation={animateRotation}
                renderMode={renderMode}
                selectedPartId={selectedPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
              />
            )}

            {activeModel === "boxer" && (
              <BoxerEngineModel
                telemetry={telemetry}
                twin={twin}
                explosionFactor={explosionFactor}
                showCutaway={showCutaway}
                animateRotation={animateRotation}
                renderMode={renderMode}
                selectedPartId={selectedPartId}
                onSelectPart={(id) => setSelectedPartId(id)}
              />
            )}
          </Suspense>
        </Canvas>

        {/* Top-Left Engineering Specification Box */}
        {showHudOverlays && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-3 shadow-sm text-xs max-w-xs pointer-events-auto transition-all">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  {activeModel === "turbine"
                    ? "AERO PROPULSION TWIN"
                    : activeModel === "uav"
                    ? "HUM3D MULTI-ROTOR VTOL DRONE"
                    : "AERO PISTON TESTBED"}
                </span>
                <h4 className="font-bold text-slate-900 text-sm">
                  {activeModel === "turbine"
                    ? "AeroTwin TP-120 Gas Turbine"
                    : activeModel === "uav"
                    ? "SKYFALL #001 Powertrain"
                    : "DRDO Boxer Testbed B"}
                </h4>
                {activeModel === "uav" && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      EXPLORATION
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      SURVEILLANCE
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      TRANSPORT
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="px-1.5 py-0.5 rounded bg-blue-50 font-mono text-[10px] text-blue-700 font-semibold border border-blue-200 flex items-center gap-1">
                  <Sun className="w-2.5 h-2.5 text-blue-500" />
                  1024px HDR
                </span>
                <span className="text-[9px] text-slate-500 capitalize font-medium">
                  {hdrPreset === "hangar"
                    ? "Hangar HD"
                    : hdrPreset === "testcell"
                    ? "Test Cell HD"
                    : hdrPreset === "flightline"
                    ? "Runway HD"
                    : "Cleanroom HD"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-2 text-[11px]">
              <div className="text-slate-500">Shaft Velocity:</div>
              <div className="font-mono text-right font-medium text-slate-800">{telemetry.rpm} RPM</div>

              <div className="text-slate-500">Exhaust Gas Temp (EGT):</div>
              <div
                className="font-mono text-right font-bold"
                style={{ color: telemetry.egt_c > 760 ? "#ef4444" : "#10b981" }}
              >
                {telemetry.egt_c}°C
              </div>

              <div className="text-slate-500">Cylinder Head Temp:</div>
              <div className="font-mono text-right text-slate-800">{telemetry.cht_c}°C</div>

              <div className="text-slate-500">Lubrication Pressure:</div>
              <div className="font-mono text-right text-slate-800">{Math.round(telemetry.oil_pressure_kpa)} kPa</div>

              <div className="text-slate-500">Bearing Vibration:</div>
              <div
                className="font-mono text-right font-bold"
                style={{ color: telemetry.vibration_g > 0.4 ? "#ef4444" : "#059669" }}
              >
                {telemetry.vibration_g}g
              </div>

              <div className="text-slate-500">Cutaway Section:</div>
              <div className="font-semibold text-right text-blue-600">
                {showCutaway ? "180° Exposed" : "Full Cowl"}
              </div>
            </div>
          </div>
        )}

        {/* Top-Right Subsystem Health Floating Box */}
        {showHudOverlays && (
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-3 shadow-sm text-xs w-60 pointer-events-auto transition-all">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 font-semibold text-slate-800">
              <span>Subsystem Health Indices</span>
              <Activity className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="space-y-2 pt-2">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Flame className="w-3 h-3 text-amber-500" /> Thermal / EGT
                  </span>
                  <span className="font-mono font-medium" style={{ color: getHealthColor(twin.component_health.thermal) }}>
                    {twin.component_health.thermal}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${twin.component_health.thermal}%`,
                      backgroundColor: getHealthColor(twin.component_health.thermal)
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Droplet className="w-3 h-3 text-blue-500" /> Lubrication / Oil
                  </span>
                  <span className="font-mono font-medium" style={{ color: getHealthColor(twin.component_health.lubrication) }}>
                    {twin.component_health.lubrication}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${twin.component_health.lubrication}%`,
                      backgroundColor: getHealthColor(twin.component_health.lubrication)
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Activity className="w-3 h-3 text-indigo-500" /> Mechanical / Shaft
                  </span>
                  <span className="font-mono font-medium" style={{ color: getHealthColor(twin.component_health.mechanical) }}>
                    {twin.component_health.mechanical}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${twin.component_health.mechanical}%`,
                      backgroundColor: getHealthColor(twin.component_health.mechanical)
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Zap className="w-3 h-3 text-yellow-500" /> Combustor / Power
                  </span>
                  <span className="font-mono font-medium" style={{ color: getHealthColor(twin.component_health.combustion) }}>
                    {twin.component_health.combustion}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${twin.component_health.combustion}%`,
                      backgroundColor: getHealthColor(twin.component_health.combustion)
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hum3D Skyfall #001 Authentic Specifications Card */}
        {activeModel === "uav" && showHudOverlays && (
          <div className="absolute top-[228px] right-3 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-3 shadow-sm text-xs w-60 pointer-events-auto transition-all">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                Skyfall #001 Specs
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="space-y-1.5 pt-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Rotor Count:</span>
                <span className="font-mono font-bold text-slate-800">6 (Hexacopter)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Max Payload:</span>
                <span className="font-mono font-bold text-slate-800">25 kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Flight Time:</span>
                <span className="font-mono font-bold text-slate-800">40 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Max Speed:</span>
                <span className="font-mono font-bold text-slate-800">72 km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Propulsion:</span>
                <span className="font-mono font-bold text-orange-600">6x Brushless VTOL</span>
              </div>
            </div>
          </div>
        )}

        {/* Hum3D 5 Detail Shots Floating Preset Bar */}
        {activeModel === "uav" && (
          <div className="absolute bottom-[74px] left-4 right-4 max-w-2xl mx-auto flex items-center justify-center pointer-events-auto z-10">
            <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 shadow-lg flex flex-wrap items-center justify-center gap-1.5 text-white">
              <span className="text-orange-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 pr-1 border-r border-slate-700">
                <Camera className="w-3 h-3 text-orange-400" /> Detail Shots:
              </span>
              {[
                { id: "detail-radar", label: "1. Radar Dome" },
                { id: "detail-motor", label: "2. Motor Stator" },
                { id: "detail-fc", label: "3. Flight Controller" },
                { id: "detail-battery", label: "4. Battery Pack" },
                { id: "detail-gear", label: "5. Landing Gear" },
              ].map((shot) => (
                <button
                  key={shot.id}
                  onClick={() => setCurrentView(shot.id as ViewAngle)}
                  className={`px-2.5 py-0.5 rounded-full font-medium transition flex items-center gap-1 text-[10px] ${
                    currentView === shot.id
                      ? "bg-orange-500 text-white font-bold shadow-xs"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                  }`}
                >
                  <span>{shot.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Exploded View CAD Slider Controls */}
        <div className="absolute bottom-4 left-4 right-4 max-w-xl mx-auto bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-md">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2 font-medium text-slate-800">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Exploded View Inspection (CAD Disassembly)</span>
            </div>
            <span className="font-mono font-bold text-blue-600">
              {Math.round(explosionFactor * 100)}% Disassembled
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setExplosionFactor(0)}
              className="px-2 py-1 text-[11px] font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              0% (Assembled)
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={explosionFactor}
              onChange={(e) => setExplosionFactor(parseFloat(e.target.value))}
              className="flex-1 accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <button
              onClick={() => setExplosionFactor(1)}
              className="px-2 py-1 text-[11px] font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              100% (Exploded)
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Parts List / Component Explorer (Collapsible for maximum 3D view place size) */}
      <div className="border-t border-slate-200 bg-white p-2.5 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {activeModel === "turbine"
                ? "TURBINE PROPULSION COMPONENTS"
                : activeModel === "uav"
                ? "UAV POWERTRAIN COMPONENTS"
                : "AERO PISTON COMPONENTS"}
            </span>
            <span className="text-[11px] text-slate-500 font-medium hidden md:inline">
              (Click component to inspect physical tolerances, material & twin telemetry)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Sub-assemblies: {activeCatalog.length}
            </span>
            {selectedPart && !showPartsTray && (
              <span className="text-[11px] text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                #{selectedPart.number} {selectedPart.name}
              </span>
            )}
            <button
              onClick={() => setShowPartsTray(!showPartsTray)}
              className="px-2.5 py-1 rounded text-[11px] font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition shadow-2xs"
              title={showPartsTray ? "Collapse parts catalog to maximize 3D canvas" : "Expand parts catalog"}
            >
              {showPartsTray ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Collapse Tray</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Show Parts Tray ({activeCatalog.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {showPartsTray && (
          <div className="mt-2.5 space-y-2.5">
            {/* Parts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
          {activeCatalog.map((part) => {
            const isSelected = part.id === selectedPartId;
            const health = getSubsystemHealth(part.healthKey);
            return (
              <button
                key={part.id}
                onClick={() => setSelectedPartId(part.id)}
                className={`flex flex-col p-2 rounded-lg text-left border transition text-xs relative ${
                  isSelected
                    ? "bg-blue-50/80 border-blue-500 ring-1 ring-blue-500 shadow-xs"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="w-4 h-4 rounded-full bg-slate-900 text-white font-mono text-[9px] font-bold flex items-center justify-center">
                    {part.number}
                  </span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getHealthColor(health) }}
                    title={`Health: ${health}%`}
                  />
                </div>
                <div className="font-semibold text-[11px] text-slate-800 line-clamp-1">
                  {part.name}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5 font-mono">
                  {health}% health
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Part Detail Drawer */}
        {selectedPart && (
          <div className="mt-3 p-3 bg-blue-50/60 border border-blue-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center font-mono">
                {selectedPart.number}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  {selectedPart.name}
                </div>
                <div className="text-slate-600 text-[11px]">
                  Subsystem: <span className="font-medium text-slate-800">{selectedPart.category}</span> | Material: <span className="font-mono text-slate-700">{selectedPart.material}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Operational Specs</div>
                <div className="font-medium text-slate-800">{selectedPart.specs}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Twin Degradation Index</div>
                <div
                  className="font-bold text-sm font-mono"
                  style={{ color: getHealthColor(getSubsystemHealth(selectedPart.healthKey)) }}
                >
                  {getSubsystemHealth(selectedPart.healthKey)}% Nominal
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
        )}
      </div>
    </div>
  );
};
