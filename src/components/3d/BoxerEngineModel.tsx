import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TelemetrySample, DigitalTwinState } from "../../types";
import { PBR_PRESETS, getHealthTintColor } from "./materials";

interface BoxerEngineModelProps {
  telemetry: TelemetrySample;
  twin: DigitalTwinState;
  explosionFactor: number;
  showCutaway: boolean;
  animateRotation: boolean;
  renderMode: "shaded" | "wireframe" | "thermal" | "xray";
  selectedPartId: string | null;
  onSelectPart: (partId: string) => void;
}

export const BoxerEngineModel: React.FC<BoxerEngineModelProps> = ({
  telemetry,
  twin,
  explosionFactor,
  showCutaway,
  animateRotation,
  renderMode,
  selectedPartId,
  onSelectPart,
}) => {
  const crankRef = useRef<THREE.Group>(null);

  // Rotate Crankshaft & Propeller Flange
  useFrame((_, delta) => {
    if (animateRotation && crankRef.current) {
      const rotSpeed = Math.max(0.8, (telemetry.rpm / 60) * Math.PI * 2 * 0.1);
      crankRef.current.rotation.z += rotSpeed * delta;
    }
  });

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

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Cast Aluminum Crankcase & Oil Sump (box-1) */}
      <group
        position={getExplodedPos([0, 0, 0], [0, 0, 0], 0)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("box-1");
        }}
      >
        <mesh castShadow>
          <boxGeometry args={[1.1, 0.85, 1.35]} />
          {renderMode === "shaded" ? (
            <meshPhysicalMaterial
              {...PBR_PRESETS.aluminum}
              envMapIntensity={1.3}
              transparent={showCutaway}
              opacity={showCutaway ? 0.45 : 1.0}
              side={THREE.DoubleSide}
            />
          ) : (
            getPartMaterial("box-1", "aluminum", "mechanical")
          )}
        </mesh>
        {/* Oil Sump Pan at bottom */}
        <mesh position={[0, -0.52, 0]} castShadow>
          <boxGeometry args={[0.75, 0.22, 1.1]} />
          {getPartMaterial("box-1", "aluminum", "lubrication")}
        </mesh>
      </group>

      {/* 2. 4x Horizontally Opposed Finned Cylinders (box-2) */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("box-2");
        }}
      >
        {/* Cylinders: Left 1 & 2 */}
        {[-0.32, 0.32].map((zPos, idx) => {
          const pos = getExplodedPos([0.95, 0, zPos], [1, 0, 0], 0.9);
          return (
            <group key={`l-${idx}`} position={pos} rotation={[0, 0, Math.PI / 2]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.3, 0.3, 0.8, 24]} />
                {getPartMaterial("box-2", "inconel", "thermal")}
              </mesh>
              {/* Radial Cooling Fins */}
              {[-0.25, -0.15, -0.05, 0.05, 0.15, 0.25].map((yFin, fIdx) => (
                <mesh key={fIdx} position={[0, yFin, 0]}>
                  <cylinderGeometry args={[0.38, 0.38, 0.02, 24]} />
                  {getPartMaterial("box-2", "aluminum", "thermal")}
                </mesh>
              ))}
            </group>
          );
        })}

        {/* Cylinders: Right 3 & 4 */}
        {[-0.32, 0.32].map((zPos, idx) => {
          const pos = getExplodedPos([-0.95, 0, zPos], [-1, 0, 0], 0.9);
          return (
            <group key={`r-${idx}`} position={pos} rotation={[0, 0, -Math.PI / 2]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.3, 0.3, 0.8, 24]} />
                {getPartMaterial("box-2", "inconel", "thermal")}
              </mesh>
              {/* Radial Cooling Fins */}
              {[-0.25, -0.15, -0.05, 0.05, 0.15, 0.25].map((yFin, fIdx) => (
                <mesh key={fIdx} position={[0, yFin, 0]}>
                  <cylinderGeometry args={[0.38, 0.38, 0.02, 24]} />
                  {getPartMaterial("box-2", "aluminum", "thermal")}
                </mesh>
              ))}
            </group>
          );
        })}
      </group>

      {/* 3. Dual Cylinder Heads & Valve Rocker Covers (box-3) */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("box-3");
        }}
      >
        {/* Left Cylinder Head */}
        <mesh position={getExplodedPos([1.5, 0, 0], [1, 0, 0], 1.2)} castShadow>
          <boxGeometry args={[0.26, 0.65, 1.15]} />
          {getPartMaterial("box-3", "anodizedOrange", "combustion")}
        </mesh>
        {/* Right Cylinder Head */}
        <mesh position={getExplodedPos([-1.5, 0, 0], [-1, 0, 0], 1.2)} castShadow>
          <boxGeometry args={[0.26, 0.65, 1.15]} />
          {getPartMaterial("box-3", "anodizedOrange", "combustion")}
        </mesh>
      </group>

      {/* 4. Intake Manifold & Throttle Body (box-4) */}
      <group
        position={getExplodedPos([0, 0.72, 0], [0, 1, 0], 1.0)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("box-4");
        }}
      >
        {/* Central Plenum Chamber */}
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.22, 0.7]} />
          {getPartMaterial("box-4", "aluminum", "combustion")}
        </mesh>
        {/* Throttle Body & Air Filter Neck */}
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.22, 20]} />
          {getPartMaterial("box-4", "anodizedBlue", "combustion")}
        </mesh>
        {/* Left & Right Runner Tubes */}
        <mesh position={[0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.55, 16]} />
          {getPartMaterial("box-4", "aluminum", "combustion")}
        </mesh>
        <mesh position={[-0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.55, 16]} />
          {getPartMaterial("box-4", "aluminum", "combustion")}
        </mesh>
      </group>

      {/* 5. Tuned Stainless Exhaust Headers (box-5) */}
      <group
        position={getExplodedPos([0, -0.65, 0], [0, -1, 0], 1.0)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("box-5");
        }}
      >
        <mesh position={[0.75, 0, 0]} rotation={[0, 0, -0.3]} castShadow>
          <cylinderGeometry args={[0.065, 0.065, 1.2, 16]} />
          {getPartMaterial("box-5", "heatTreatedAlloy", "thermal")}
        </mesh>
        <mesh position={[-0.75, 0, 0]} rotation={[0, 0, 0.3]} castShadow>
          <cylinderGeometry args={[0.065, 0.065, 1.2, 16]} />
          {getPartMaterial("box-5", "heatTreatedAlloy", "thermal")}
        </mesh>
      </group>

      {/* 6. Rotating Crankshaft & Propeller Flange (box-6) */}
      <group
        ref={crankRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart("box-6");
        }}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 1.6, 20]} />
          {getPartMaterial("box-6", "chrome", "mechanical")}
        </mesh>
        {/* Propeller Drive Flange with 6 Lug Bolts */}
        <group position={[0, 0, 0.85]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.08, 24]} />
            {getPartMaterial("box-6", "aluminum", "mechanical")}
          </mesh>
          {Array.from({ length: 6 }).map((_, bIdx) => {
            const ang = (bIdx * Math.PI) / 3;
            return (
              <mesh
                key={bIdx}
                position={[Math.cos(ang) * 0.22, Math.sin(ang) * 0.22, 0.05]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry args={[0.02, 0.02, 0.05, 8]} />
                {getPartMaterial("box-6", "chrome", "mechanical")}
              </mesh>
            );
          })}
        </group>
      </group>
    </group>
  );
};
