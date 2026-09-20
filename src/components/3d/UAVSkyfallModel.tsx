import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TelemetrySample, DigitalTwinState } from "../../types";
import { PBR_PRESETS, getHealthTintColor, getCarbonTexture, getKnurledTexture } from "./materials";

interface UAVSkyfallModelProps {
  telemetry: TelemetrySample;
  twin: DigitalTwinState;
  explosionFactor: number;
  showCutaway: boolean;
  animateRotation: boolean;
  renderMode: "shaded" | "wireframe" | "thermal" | "xray";
  selectedPartId: string | null;
  onSelectPart: (partId: string) => void;
}

export const UAVSkyfallModel: React.FC<UAVSkyfallModelProps> = ({
  telemetry,
  twin,
  explosionFactor,
  showCutaway,
  animateRotation,
  renderMode,
  selectedPartId,
  onSelectPart,
}) => {
  const propGroupsRef = useRef<THREE.Group[]>([]);

  // Rotate Propellers with alternating CW / CCW directions
  useFrame((_, delta) => {
    if (animateRotation) {
      const baseSpeed = Math.max(1.0, (telemetry.rpm / 60) * Math.PI * 2 * 0.12);
      propGroupsRef.current.forEach((grp, idx) => {
        if (grp) {
          const dir = idx % 2 === 0 ? 1 : -1;
          grp.rotation.y += baseSpeed * dir * delta;
        }
      });
    }
  });

  // Material helper
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
      const health = healthKey ? twin.component_health[healthKey] : 88;
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
    basePos: [number, number, number],
    dir: [number, number, number],
    dist: number
  ): [number, number, number] => {
    return [
      basePos[0] + dir[0] * dist * explosionFactor,
      basePos[1] + dir[1] * dist * explosionFactor,
      basePos[2] + dir[2] * dist * explosionFactor,
    ];
  };

  // 6 Arm angles for Hexacopter
  const armAngles = useMemo(() => [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3], []);

  // Boom length and motor offset
  const armRadius = 2.45;

  return (
    <group position={[0, 0, 0]}>
      {/* =====================================================================
          1. RADAR DOME & MAST ASSEMBLY (uav-1)
          ===================================================================== */}
      <group
        position={getExplodedPos([0, 0.95, 0], [0, 1, 0], 1.6)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("uav-1");
        }}
      >
        {/* Aerodynamic Radome Cap */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <sphereGeometry args={[0.42, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          {getPartMaterial("uav-1", "carbonComposite", "mechanical")}
        </mesh>
        {/* Knurled Radar Antenna Band */}
        <mesh position={[0, 0.32, 0]} castShadow>
          <cylinderGeometry args={[0.39, 0.41, 0.12, 32]} />
          {getPartMaterial("uav-1", "aluminum", "mechanical")}
        </mesh>
        {/* Support Pedestal Mast */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.12, 0.28, 16]} />
          {getPartMaterial("uav-1", "titaniumDark", "mechanical")}
        </mesh>
        {/* Top Telemetry LED Beacon */}
        <mesh position={[0, 0.88, 0]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial
            color={telemetry.vibration_g > 0.4 ? "#ef4444" : "#10b981"}
            emissive={telemetry.vibration_g > 0.4 ? "#ef4444" : "#10b981"}
            emissiveIntensity={2.5}
          />
        </mesh>
      </group>

      {/* =====================================================================
          2. 3-AXIS EO/IR GIMBAL & SENSOR POD (uav-2)
          ===================================================================== */}
      <group
        position={getExplodedPos([0, -0.65, 0.65], [0, -1, 0.5], 1.4)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("uav-2");
        }}
      >
        {/* Gimbal Pan Base */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.08, 24]} />
          {getPartMaterial("uav-2", "aluminum", "mechanical")}
        </mesh>
        {/* Gimbal Roll / Tilt Fork Yoke */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.42, 0.25, 0.06]} />
          {getPartMaterial("uav-2", "titaniumDark", "mechanical")}
        </mesh>
        {/* Sensor Turret Sphere */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <sphereGeometry args={[0.22, 28, 28]} />
          {getPartMaterial("uav-2", "carbonComposite", "mechanical")}
        </mesh>
        {/* Primary Optical Sapphire Lens */}
        <mesh position={[0.06, -0.15, 0.19]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.04, 24]} />
          {getPartMaterial("uav-2", "sapphireGlass", "mechanical")}
        </mesh>
        {/* Secondary Infrared Aperture */}
        <mesh position={[-0.08, -0.15, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.04, 16]} />
          {getPartMaterial("uav-2", "heatTreatedAlloy", "mechanical")}
        </mesh>
        {/* Laser Rangefinder Emitter Dot */}
        <mesh position={[0.06, -0.06, 0.2]}>
          <sphereGeometry args={[0.015, 12, 12]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* =====================================================================
          3. AERODYNAMIC CENTER FUSELAGE COWLING (uav-3)
          ===================================================================== */}
      <group
        position={getExplodedPos([0, 0.25, 0], [0, 0.8, 0], 1.0)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("uav-3");
        }}
      >
        {/* Hexagonal Monocoque Top Shell */}
        <mesh castShadow>
          <cylinderGeometry args={[1.22, 1.35, 0.35, 6]} />
          {renderMode === "shaded" ? (
            <meshPhysicalMaterial
              {...PBR_PRESETS.carbonComposite}
              envMapIntensity={1.1}
              transparent={showCutaway}
              opacity={showCutaway ? 0.35 : 1.0}
              side={THREE.DoubleSide}
            />
          ) : (
            getPartMaterial("uav-3", "carbonComposite", "mechanical")
          )}
        </mesh>
        {/* Central Top Access Hatch */}
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.55, 0.04, 6]} />
          {getPartMaterial("uav-3", "aluminum", "mechanical")}
        </mesh>
        {/* Perimeter M4 Socket Cap Bolts */}
        {Array.from({ length: 6 }).map((_, i) => {
          const ang = (i * Math.PI) / 3;
          return (
            <mesh
              key={i}
              position={[Math.cos(ang) * 1.15, 0.18, Math.sin(ang) * 1.15]}
            >
              <cylinderGeometry args={[0.025, 0.025, 0.04, 8]} />
              {getPartMaterial("uav-3", "chrome", "mechanical")}
            </mesh>
          );
        })}
      </group>

      {/* =====================================================================
          4. 6x HEAVY-DUTY HEX TUBULAR BOOM ARMS (uav-4)
          ===================================================================== */}
      <group
        position={getExplodedPos([0, 0.1, 0], [0, 0, 0], 0)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("uav-4");
        }}
      >
        {armAngles.map((ang, i) => {
          const cosA = Math.cos(ang);
          const sinA = Math.sin(ang);
          const dir: [number, number, number] = [cosA, 0, sinA];
          const pos = getExplodedPos(
            [cosA * (armRadius / 2), 0.1, sinA * (armRadius / 2)],
            dir,
            0.6
          );

          return (
            <group key={i} position={pos} rotation={[0, -ang, 0]}>
              {/* Carbon Fiber Boom Tube */}
              <mesh position={[0, 0, armRadius / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.055, 0.055, armRadius, 20]} />
                {getPartMaterial("uav-4", "carbonComposite", "mechanical")}
              </mesh>
              {/* Machined Aluminum Clamping Bulkhead at Fuselage */}
              <mesh position={[0, 0, 0.35]} castShadow>
                <boxGeometry args={[0.18, 0.18, 0.16]} />
                {getPartMaterial("uav-4", "aluminum", "mechanical")}
              </mesh>
              {/* Outer Motor Mount Bulkhead */}
              <mesh position={[0, 0, armRadius - 0.15]} castShadow>
                <boxGeometry args={[0.16, 0.16, 0.18]} />
                {getPartMaterial("uav-4", "anodizedOrange", "mechanical")}
              </mesh>
            </group>
          );
        })}
      </group>

      {/* =====================================================================
          5. 6x HIGH-TORQUE BRUSHLESS OUTRUNNER MOTORS (uav-5)
          ===================================================================== */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("uav-5");
        }}
      >
        {armAngles.map((ang, i) => {
          const cosA = Math.cos(ang);
          const sinA = Math.sin(ang);
          const dir: [number, number, number] = [cosA, 0.3, sinA];
          const pos = getExplodedPos(
            [cosA * armRadius, 0.28, sinA * armRadius],
            dir,
            0.8
          );

          return (
            <group key={i} position={pos}>
              {/* Motor Stator Base */}
              <mesh position={[0, -0.05, 0]} castShadow>
                <cylinderGeometry args={[0.18, 0.18, 0.06, 24]} />
                {getPartMaterial("uav-5", "aluminum", "combustion")}
              </mesh>
              {/* Copper Electromagnetic Windings visible inside */}
              <mesh position={[0, 0.04, 0]}>
                <torusGeometry args={[0.13, 0.045, 12, 24]} />
                {getPartMaterial("uav-5", "copperWinding", "combustion")}
              </mesh>
              {/* Outer Rotor Bell with Cooling Slots */}
              <mesh position={[0, 0.05, 0]} castShadow>
                <cylinderGeometry args={[0.19, 0.19, 0.14, 28]} />
                {getPartMaterial("uav-5", "anodizedOrange", "combustion")}
              </mesh>
              {/* Center Propeller Shaft */}
              <mesh position={[0, 0.16, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 0.14, 16]} />
                {getPartMaterial("uav-5", "chrome", "mechanical")}
              </mesh>
            </group>
          );
        })}
      </group>

      {/* =====================================================================
          6. 6x AERODYNAMIC CARBON FIBER PROPELLERS (uav-6)
          ===================================================================== */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("uav-6");
        }}
      >
        {armAngles.map((ang, i) => {
          const cosA = Math.cos(ang);
          const sinA = Math.sin(ang);
          const dir: [number, number, number] = [cosA, 0.6, sinA];
          const pos = getExplodedPos(
            [cosA * armRadius, 0.44, sinA * armRadius],
            dir,
            1.2
          );

          return (
            <group
              key={i}
              position={pos}
              ref={(el) => {
                if (el) propGroupsRef.current[i] = el;
              }}
            >
              {/* Propeller Hub Cap */}
              <mesh position={[0, 0.04, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
                {getPartMaterial("uav-6", "aluminum", "mechanical")}
              </mesh>
              {/* Blade 1 */}
              <mesh position={[0.48, 0.04, 0]} rotation={[0.08, 0, 0.05]} castShadow>
                <boxGeometry args={[0.92, 0.015, 0.14]} />
                {getPartMaterial("uav-6", "carbonComposite", "mechanical")}
              </mesh>
              {/* Blade 2 */}
              <mesh position={[-0.48, 0.04, 0]} rotation={[-0.08, 0, -0.05]} castShadow>
                <boxGeometry args={[0.92, 0.015, 0.14]} />
                {getPartMaterial("uav-6", "carbonComposite", "mechanical")}
              </mesh>
              {/* High-visibility safety orange tips */}
              <mesh position={[0.9, 0.04, 0]}>
                <boxGeometry args={[0.1, 0.018, 0.13]} />
                <meshBasicMaterial color="#f97316" />
              </mesh>
              <mesh position={[-0.9, 0.04, 0]}>
                <boxGeometry args={[0.1, 0.018, 0.13]} />
                <meshBasicMaterial color="#f97316" />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* =====================================================================
          7. AVIONICS & FLIGHT CONTROLLER STACK (uav-7)
          ===================================================================== */}
      <group
        position={getExplodedPos([0, 0.12, 0], [0, 0.4, 0], 0.8)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("uav-7");
        }}
      >
        {/* Shielded Avionics Enclosure */}
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.14, 0.55]} />
          {getPartMaterial("uav-7", "titaniumDark", "combustion")}
        </mesh>
        {/* Dual GNSS Antenna Pucks */}
        <mesh position={[0.18, 0.1, 0.18]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
          {getPartMaterial("uav-7", "heavyPolymer", "mechanical")}
        </mesh>
        <mesh position={[-0.18, 0.1, -0.18]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
          {getPartMaterial("uav-7", "heavyPolymer", "mechanical")}
        </mesh>
        {/* 6 Peripheral ESC Speed Controllers */}
        {armAngles.map((ang, escIdx) => (
          <mesh
            key={escIdx}
            position={[Math.cos(ang) * 0.48, 0, Math.sin(ang) * 0.48]}
            rotation={[0, -ang, 0]}
            castShadow
          >
            <boxGeometry args={[0.18, 0.06, 0.12]} />
            {getPartMaterial("uav-7", "aluminum", "combustion")}
          </mesh>
        ))}
      </group>

      {/* =====================================================================
          8. DUAL HIGH-CAPACITY BATTERY PACKS (uav-8)
          ===================================================================== */}
      <group
        position={getExplodedPos([0, -0.22, 0], [0, -0.5, 0], 0.9)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("uav-8");
        }}
      >
        {/* Port Battery Module */}
        <group position={[0.38, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.32, 0.85]} />
            {getPartMaterial("uav-8", "heavyPolymer", "combustion")}
          </mesh>
          {/* Strengthening ribs */}
          {[-0.25, 0, 0.25].map((zPos, rIdx) => (
            <mesh key={rIdx} position={[0.22, 0, zPos]}>
              <boxGeometry args={[0.04, 0.26, 0.05]} />
              {getPartMaterial("uav-8", "heavyPolymer", "combustion")}
            </mesh>
          ))}
          {/* Quick-release toggle latch */}
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.14, 0.04, 0.22]} />
            {getPartMaterial("uav-8", "anodizedOrange", "combustion")}
          </mesh>
        </group>

        {/* Starboard Battery Module */}
        <group position={[-0.38, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.32, 0.85]} />
            {getPartMaterial("uav-8", "heavyPolymer", "combustion")}
          </mesh>
          {/* Strengthening ribs */}
          {[-0.25, 0, 0.25].map((zPos, rIdx) => (
            <mesh key={rIdx} position={[-0.22, 0, zPos]}>
              <boxGeometry args={[0.04, 0.26, 0.05]} />
              {getPartMaterial("uav-8", "heavyPolymer", "combustion")}
            </mesh>
          ))}
          {/* Quick-release toggle latch */}
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.14, 0.04, 0.22]} />
            {getPartMaterial("uav-8", "anodizedOrange", "combustion")}
          </mesh>
        </group>
      </group>

      {/* =====================================================================
          9. FLANK ARMOR & RADIATOR LOUVER PANELS (uav-9)
          ===================================================================== */}
      <group
        position={getExplodedPos([0, 0, 0], [1, 0, 0], 0.8)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("uav-9");
        }}
      >
        <mesh position={[1.12, 0, 0]} castShadow>
          <boxGeometry args={[0.06, 0.28, 0.95]} />
          {getPartMaterial("uav-9", "aluminum", "thermal")}
        </mesh>
        <mesh position={[-1.12, 0, 0]} castShadow>
          <boxGeometry args={[0.06, 0.28, 0.95]} />
          {getPartMaterial("uav-9", "aluminum", "thermal")}
        </mesh>
      </group>

      {/* =====================================================================
          10. MODULAR PAYLOAD PODS (uav-10)
          ===================================================================== */}
      <group
        position={getExplodedPos([0, -0.42, -0.45], [0, -0.6, -0.8], 1.2)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("uav-10");
        }}
      >
        {/* Tactical Sensor/Payload Pod */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.82, 24]} />
          {getPartMaterial("uav-10", "titaniumDark", "mechanical")}
        </mesh>
        <mesh position={[0, 0, 0.42]}>
          <sphereGeometry args={[0.218, 20, 20]} />
          {getPartMaterial("uav-10", "sapphireGlass", "mechanical")}
        </mesh>
      </group>

      {/* =====================================================================
          11. SHOCK-ABSORBING LANDING GEAR SKIDS (uav-11)
          ===================================================================== */}
      <group
        position={getExplodedPos([0, -0.85, 0], [0, -1, 0], 1.0)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("uav-11");
        }}
      >
        {/* Port Skid Runner */}
        <group position={[0.75, 0, 0]}>
          {/* Horizontal Ground Tube */}
          <mesh position={[0, -0.65, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 2.2, 16]} />
            {getPartMaterial("uav-11", "carbonComposite", "mechanical")}
          </mesh>
          {/* Front Angled Strut */}
          <mesh position={[0, -0.28, 0.55]} rotation={[0.42, 0, -0.22]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.85, 16]} />
            {getPartMaterial("uav-11", "aluminum", "mechanical")}
          </mesh>
          {/* Rear Angled Strut */}
          <mesh position={[0, -0.28, -0.55]} rotation={[-0.42, 0, -0.22]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.85, 16]} />
            {getPartMaterial("uav-11", "aluminum", "mechanical")}
          </mesh>
          {/* Rubber End Bumpers */}
          <mesh position={[0, -0.62, 1.15]}>
            <sphereGeometry args={[0.065, 12, 12]} />
            {getPartMaterial("uav-11", "heavyPolymer", "mechanical")}
          </mesh>
          <mesh position={[0, -0.62, -1.15]}>
            <sphereGeometry args={[0.065, 12, 12]} />
            {getPartMaterial("uav-11", "heavyPolymer", "mechanical")}
          </mesh>
        </group>

        {/* Starboard Skid Runner */}
        <group position={[-0.75, 0, 0]}>
          {/* Horizontal Ground Tube */}
          <mesh position={[0, -0.65, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 2.2, 16]} />
            {getPartMaterial("uav-11", "carbonComposite", "mechanical")}
          </mesh>
          {/* Front Angled Strut */}
          <mesh position={[0, -0.28, 0.55]} rotation={[0.42, 0, 0.22]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.85, 16]} />
            {getPartMaterial("uav-11", "aluminum", "mechanical")}
          </mesh>
          {/* Rear Angled Strut */}
          <mesh position={[0, -0.28, -0.55]} rotation={[-0.42, 0, 0.22]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.85, 16]} />
            {getPartMaterial("uav-11", "aluminum", "mechanical")}
          </mesh>
          {/* Rubber End Bumpers */}
          <mesh position={[0, -0.62, 1.15]}>
            <sphereGeometry args={[0.065, 12, 12]} />
            {getPartMaterial("uav-11", "heavyPolymer", "mechanical")}
          </mesh>
          <mesh position={[0, -0.62, -1.15]}>
            <sphereGeometry args={[0.065, 12, 12]} />
            {getPartMaterial("uav-11", "heavyPolymer", "mechanical")}
          </mesh>
        </group>

        {/* Orange Silicone Vibration Dampening Mounts */}
        <mesh position={[0.75, 0.05, 0.55]}>
          <cylinderGeometry args={[0.07, 0.07, 0.08, 16]} />
          {getPartMaterial("uav-11", "anodizedOrange", "mechanical")}
        </mesh>
        <mesh position={[0.75, 0.05, -0.55]}>
          <cylinderGeometry args={[0.07, 0.07, 0.08, 16]} />
          {getPartMaterial("uav-11", "anodizedOrange", "mechanical")}
        </mesh>
        <mesh position={[-0.75, 0.05, 0.55]}>
          <cylinderGeometry args={[0.07, 0.07, 0.08, 16]} />
          {getPartMaterial("uav-11", "anodizedOrange", "mechanical")}
        </mesh>
        <mesh position={[-0.75, 0.05, -0.55]}>
          <cylinderGeometry args={[0.07, 0.07, 0.08, 16]} />
          {getPartMaterial("uav-11", "anodizedOrange", "mechanical")}
        </mesh>
      </group>
    </group>
  );
};
