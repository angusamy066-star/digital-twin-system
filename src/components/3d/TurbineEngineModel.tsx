import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TelemetrySample, DigitalTwinState, PartInfo } from "../../types";
import { TURBINE_PARTS_CATALOG } from "../../services/engineProfiles";
import { PBR_PRESETS, getHealthTintColor } from "./materials";

interface TurbineEngineModelProps {
  telemetry: TelemetrySample;
  twin: DigitalTwinState;
  explosionFactor: number;
  showCutaway: boolean;
  animateRotation: boolean;
  renderMode: "shaded" | "wireframe" | "thermal" | "xray";
  selectedPartId: string | null;
  onSelectPart: (partId: string) => void;
}

export const TurbineEngineModel: React.FC<TurbineEngineModelProps> = ({
  telemetry,
  twin,
  explosionFactor,
  showCutaway,
  animateRotation,
  renderMode,
  selectedPartId,
  onSelectPart,
}) => {
  const spoolRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);

  // Animate Spool & Fan Rotation
  useFrame((_, delta) => {
    if (animateRotation && spoolRef.current) {
      const rotSpeed = Math.max(0.5, (telemetry.rpm / 60) * Math.PI * 2 * 0.08);
      spoolRef.current.rotation.z += rotSpeed * delta;
    }
    if (flameRef.current) {
      const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.15;
      const heatRatio = Math.min(1.5, telemetry.egt_c / 700);
      flameRef.current.scale.set(pulse, pulse, 1 + (heatRatio - 1) * 0.2);
    }
  });

  // Material resolver helper
  const getPartMaterial = (
    partId: string,
    presetKey: keyof typeof PBR_PRESETS,
    healthKey?: keyof DigitalTwinState["component_health"]
  ) => {
    const isSelected = selectedPartId === partId;
    const basePreset = PBR_PRESETS[presetKey];

    if (renderMode === "wireframe") {
      return (
        <meshStandardMaterial
          color={isSelected ? "#3b82f6" : "#475569"}
          wireframe
          metalness={0.8}
          roughness={0.2}
        />
      );
    }

    if (renderMode === "thermal") {
      const health = healthKey ? twin.component_health[healthKey] : 85;
      const tintColor = getHealthTintColor(health);
      return (
        <meshStandardMaterial
          color={tintColor}
          emissive={tintColor}
          emissiveIntensity={isSelected ? 0.6 : 0.2}
          metalness={0.5}
          roughness={0.4}
        />
      );
    }

    if (renderMode === "xray") {
      return (
        <meshStandardMaterial
          color={isSelected ? "#60a5fa" : "#94a3b8"}
          transparent
          opacity={isSelected ? 0.5 : 0.25}
          roughness={0.1}
          metalness={0.9}
        />
      );
    }

    // Default: Realistic PBR Metallic Material with HDR Environment Reflection
    return (
      <meshPhysicalMaterial
        {...basePreset}
        envMapIntensity={isSelected ? 2.2 : (basePreset.envMapIntensity ?? 1.45)}
        emissive={isSelected ? "#2563eb" : (basePreset.emissive || "#000000")}
        emissiveIntensity={isSelected ? 0.35 : (basePreset.emissiveIntensity || 0)}
      />
    );
  };

  // Helper for exploded position
  const getExplodedPos = (
    baseZ: number,
    dir: [number, number, number],
    dist: number
  ): [number, number, number] => {
    return [
      dir[0] * dist * explosionFactor,
      dir[1] * dist * explosionFactor,
      baseZ + dir[2] * dist * explosionFactor,
    ];
  };

  // Create Aerodynamic Fan Blades
  const fanBlades = useMemo(() => {
    const blades = [];
    const count = 22;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      blades.push(
        <group key={i} rotation={[0, 0, angle]}>
          <mesh position={[0, 0.72, 0]} rotation={[0.15, 0.25, 0]} castShadow>
            <boxGeometry args={[0.07, 0.85, 0.16]} />
            {getPartMaterial("turb-2", "titaniumDark", "mechanical")}
          </mesh>
        </group>
      );
    }
    return blades;
  }, [renderMode, selectedPartId, twin.component_health]);

  // Create Compressor Stage Blisks
  const compressorStages = useMemo(() => {
    const stages = [
      { r: 0.65, z: 0.85, count: 24 },
      { r: 0.58, z: 0.65, count: 22 },
      { r: 0.52, z: 0.45, count: 20 },
      { r: 0.46, z: 0.25, count: 18 },
    ];
    return stages.map((stg, sIdx) => (
      <group key={sIdx} position={[0, 0, stg.z]}>
        {/* Blisk Hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.32, 0.12, 32]} />
          {getPartMaterial("turb-3", "titanium", "mechanical")}
        </mesh>
        {/* Blades */}
        {Array.from({ length: stg.count }).map((_, bIdx) => {
          const angle = (bIdx * Math.PI * 2) / stg.count;
          const bladeLen = stg.r - 0.3;
          return (
            <group key={bIdx} rotation={[0, 0, angle]}>
              <mesh position={[0, 0.3 + bladeLen / 2, 0]} rotation={[0.12, 0.2, 0]} castShadow>
                <boxGeometry args={[0.04, bladeLen, 0.08]} />
                {getPartMaterial("turb-3", "titanium", "mechanical")}
              </mesh>
            </group>
          );
        })}
      </group>
    ));
  }, [renderMode, selectedPartId, twin.component_health]);

  // Create Turbine Stage Disks
  const turbineDisks = useMemo(() => {
    const disks = [
      { r: 0.54, z: -0.65, count: 26 },
      { r: 0.60, z: -0.92, count: 28 },
    ];
    return disks.map((dsk, dIdx) => (
      <group key={dIdx} position={[0, 0, dsk.z]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.28, 0.14, 32]} />
          {getPartMaterial("turb-5", "inconel", "thermal")}
        </mesh>
        {Array.from({ length: dsk.count }).map((_, bIdx) => {
          const angle = (bIdx * Math.PI * 2) / dsk.count;
          const bLen = dsk.r - 0.26;
          return (
            <group key={bIdx} rotation={[0, 0, angle]}>
              <mesh position={[0, 0.26 + bLen / 2, 0]} rotation={[-0.15, -0.22, 0]} castShadow>
                <boxGeometry args={[0.04, bLen, 0.07]} />
                {getPartMaterial("turb-5", "inconel", "thermal")}
              </mesh>
            </group>
          );
        })}
      </group>
    ));
  }, [renderMode, selectedPartId, twin.component_health]);

  return (
    <group position={[0, 0, 0]}>
      {/* =====================================================================
          ROTATING ASSEMBLY (Spool shaft, fan, compressor blisks, turbine disks)
          ===================================================================== */}
      <group ref={spoolRef}>
        {/* 1. Spinner & Nose Cone (turb-1) */}
        <group
          position={getExplodedPos(1.45, [0, 0, 1], 1.4)}
          onClick={(e) => {
            e.stopPropagation();
            onSelectPart("turb-1");
          }}
        >
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.45]} castShadow>
            <coneGeometry args={[0.38, 0.9, 36]} />
            {getPartMaterial("turb-1", "chrome", "mechanical")}
          </mesh>
          {/* Spiral stripe */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}>
            <torusGeometry args={[0.37, 0.015, 12, 32]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>

        {/* 2. Low-Pressure Axial Fan / Intake Blisk (turb-2) */}
        <group
          position={getExplodedPos(1.22, [0, 0, 1], 1.0)}
          onClick={(e) => {
            e.stopPropagation();
            onSelectPart("turb-2");
          }}
        >
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.38, 0.44, 0.28, 36]} />
            {getPartMaterial("turb-2", "titanium", "mechanical")}
          </mesh>
          {fanBlades}
        </group>

        {/* 3. High-Pressure Axial Compressor (turb-3) */}
        <group
          position={getExplodedPos(0, [0, 0, 1], 0.65)}
          onClick={(e) => {
            e.stopPropagation();
            onSelectPart("turb-3");
          }}
        >
          {compressorStages}
          {/* Central High-Speed Spool Shaft */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.2]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 1.8, 24]} />
            {getPartMaterial("turb-3", "chrome", "mechanical")}
          </mesh>
        </group>

        {/* 5. High-Pressure & Low-Pressure Turbine Stage (turb-5) */}
        <group
          position={getExplodedPos(0, [0, 0, -1], 0.6)}
          onClick={(e) => {
            e.stopPropagation();
            onSelectPart("turb-5");
          }}
        >
          {turbineDisks}
          {/* Turbine Shaft Extension */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.75]} castShadow>
            <cylinderGeometry args={[0.14, 0.14, 0.8, 24]} />
            {getPartMaterial("turb-5", "chrome", "mechanical")}
          </mesh>
        </group>
      </group>

      {/* =====================================================================
          STATIC CASINGS & COMBUSTOR (Stationary components)
          ===================================================================== */}

      {/* 4. Annular Combustor Chamber (turb-4) */}
      <group
        position={getExplodedPos(-0.15, [0, 0.8, 0], 1.1)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("turb-4");
        }}
      >
        {/* Combustor outer casing (Double-sided or cutaway) */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry
            args={[0.48, 0.44, 0.62, 32, 1, true, 0, showCutaway ? Math.PI : Math.PI * 2]}
          />
          {getPartMaterial("turb-4", "inconel", "combustion")}
        </mesh>
        {/* Combustor inner flame liner with cooling dilution holes */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry
            args={[0.34, 0.32, 0.58, 24, 1, true, 0, showCutaway ? Math.PI : Math.PI * 2]}
          />
          {getPartMaterial("turb-4", "heatTreatedAlloy", "combustion")}
        </mesh>
        {/* 12 Radial Fuel Injectors */}
        {Array.from({ length: showCutaway ? 6 : 12 }).map((_, injIdx) => {
          const angle = (injIdx * Math.PI * 2) / 12;
          return (
            <group key={injIdx} rotation={[0, 0, angle]}>
              <mesh position={[0, 0.52, 0.15]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, 0.14, 12]} />
                {getPartMaterial("turb-4", "anodizedOrange", "combustion")}
              </mesh>
              <mesh position={[0, 0.6, 0.15]}>
                <sphereGeometry args={[0.032, 12, 12]} />
                {getPartMaterial("turb-4", "aluminum", "combustion")}
              </mesh>
            </group>
          );
        })}
        {/* Glowing Flame Core */}
        <mesh ref={flameRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <torusGeometry args={[0.39, 0.06, 16, 32, showCutaway ? Math.PI : Math.PI * 2]} />
          {getPartMaterial("turb-4", "flameCore", "combustion")}
        </mesh>
      </group>

      {/* 6. Convergent-Divergent Exhaust Nozzle & Mixer (turb-6) */}
      <group
        position={getExplodedPos(-1.45, [0, 0, -1], 1.2)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("turb-6");
        }}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry
            args={[0.55, 0.48, 0.85, 36, 1, true, 0, showCutaway ? Math.PI : Math.PI * 2]}
          />
          {getPartMaterial("turb-6", "heatTreatedAlloy", "thermal")}
        </mesh>
        {/* Exhaust Center Plug Tail Cone */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.2]} castShadow>
          <coneGeometry args={[0.22, 0.75, 28]} />
          {getPartMaterial("turb-6", "titaniumDark", "thermal")}
        </mesh>
        {/* Variable Nozzle Exit Petals Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.42]}>
          <torusGeometry args={[0.54, 0.025, 12, 36]} />
          {getPartMaterial("turb-6", "titaniumDark", "thermal")}
        </mesh>
      </group>

      {/* 7. Engine Nacelle & Outer Casing (turb-7) */}
      <group
        position={getExplodedPos(0.2, [0, 1.2, 0], 1.2)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("turb-7");
        }}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry
            args={[1.15, 1.1, 2.2, 40, 1, true, 0, showCutaway ? Math.PI : Math.PI * 2]}
          />
          {renderMode === "shaded" ? (
            <meshPhysicalMaterial
              color="#334155"
              metalness={0.88}
              roughness={0.20}
              clearcoat={0.4}
              clearcoatRoughness={0.15}
              envMapIntensity={1.4}
              transparent={showCutaway}
              opacity={showCutaway ? 0.38 : 1.0}
              side={THREE.DoubleSide}
            />
          ) : (
            getPartMaterial("turb-7", "titaniumDark", "mechanical")
          )}
        </mesh>
        {/* Intake Cowl Leading Edge Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1.1]}>
          <torusGeometry args={[1.14, 0.05, 16, 40]} />
          {getPartMaterial("turb-7", "chrome", "mechanical")}
        </mesh>
      </group>

      {/* 8. Accessory Drive Gearbox & Fuel Pump (turb-8) */}
      <group
        position={getExplodedPos(0.3, [0, -1.2, 0], 1.0)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("turb-8");
        }}
      >
        <mesh position={[0, -1.15, 0.4]} castShadow>
          <boxGeometry args={[0.55, 0.38, 0.7]} />
          {getPartMaterial("turb-8", "aluminum", "lubrication")}
        </mesh>
        {/* Fuel control unit */}
        <mesh position={[0.22, -1.12, 0.55]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.28, 16]} />
          {getPartMaterial("turb-8", "anodizedBlue", "lubrication")}
        </mesh>
        {/* Lubrication filter housing */}
        <mesh position={[-0.2, -1.15, 0.55]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.32, 16]} />
          {getPartMaterial("turb-8", "anodizedOrange", "lubrication")}
        </mesh>
        {/* Radial Drive Tower Shaft connecting to engine core */}
        <mesh position={[0, -0.75, 0.4]}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 16]} />
          {getPartMaterial("turb-8", "chrome", "mechanical")}
        </mesh>
      </group>

      {/* 9. Dual Ceramic Hybrid Mainshaft Bearings (turb-9) */}
      <group
        position={getExplodedPos(0.95, [0, 0, 0.5], 0.8)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("turb-9");
        }}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.28, 0.055, 16, 32]} />
          {getPartMaterial("turb-9", "chrome", "mechanical")}
        </mesh>
        {/* Vibration Telemetry Accelerometer Sensor Probe */}
        <mesh position={[0.3, 0.15, 0]}>
          <boxGeometry args={[0.06, 0.08, 0.06]} />
          <meshStandardMaterial
            color={telemetry.vibration_g > 0.4 ? "#ef4444" : "#10b981"}
            emissive={telemetry.vibration_g > 0.4 ? "#ef4444" : "#10b981"}
            emissiveIntensity={0.6}
          />
        </mesh>
      </group>

      {/* 10. Lubrication Scavenge & Oil Cooler Rail (turb-10) */}
      <group
        position={getExplodedPos(-0.35, [1.0, 0, 0], 0.9)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("turb-10");
        }}
      >
        <mesh position={[0.75, 0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 1.4, 16]} />
          {getPartMaterial("turb-10", "anodizedOrange", "lubrication")}
        </mesh>
        {/* Oil Heat Exchanger Fin Pack */}
        <mesh position={[0.75, -0.2, -0.1]} castShadow>
          <boxGeometry args={[0.12, 0.28, 0.55]} />
          {getPartMaterial("turb-10", "aluminum", "lubrication")}
        </mesh>
      </group>
    </group>
  );
};
