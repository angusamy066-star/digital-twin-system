import React from "react";
import { Environment, Lightformer, ContactShadows } from "@react-three/drei";

export type HdrPresetType = "hangar" | "testcell" | "flightline" | "cleanroom";

export interface StudioEnvironmentProps {
  showGrid?: boolean;
  hdrPreset?: HdrPresetType;
  hdrIntensity?: number;
  hdrRotation?: number;
  showHdrBackground?: boolean;
}

export const StudioEnvironment: React.FC<StudioEnvironmentProps> = ({
  showGrid = true,
  hdrPreset = "hangar",
  hdrIntensity = 1.35,
  hdrRotation = 0.45,
  showHdrBackground = false,
}) => {
  return (
    <>
      {/* Clean Engineering Studio Background & Depth Fog */}
      <color attach="background" args={["#f8fafc"]} />
      <fog attach="fog" args={["#f8fafc", 18, 38]} />

      {/* =====================================================================
          HIGH-RESOLUTION HDR ENVIRONMENT MAP (@react-three/drei)
          Generates a 1024px 32-bit floating-point HalfFloat HDR Cubemap
          with calibrated specular lightformers for realistic metallic reflections.
          ===================================================================== */}
      <Environment
        resolution={1024}
        background={showHdrBackground}
        environmentIntensity={hdrIntensity}
        environmentRotation={[0, hdrRotation, 0]}
      >
        {/* 1. AEROSPACE HANGAR PRESET (High-Bay Industrial Lighting) */}
        {hdrPreset === "hangar" && (
          <group>
            {/* Primary High-Bay Center Overhead Softbox */}
            <Lightformer
              form="rect"
              intensity={3.8}
              color="#ffffff"
              position={[0, 9, 0]}
              scale={[14, 14, 1]}
              target={[0, 0, 0]}
            />
            {/* Secondary Overhead Long Fixture Strip */}
            <Lightformer
              form="rect"
              intensity={2.6}
              color="#f1f5f9"
              position={[0, 11, -3]}
              scale={[20, 2.5, 1]}
              target={[0, 0, 0]}
            />
            {/* Lateral Left High-Intensity Specular Strip (Catches compressor blade bevels) */}
            <Lightformer
              form="rect"
              intensity={4.2}
              color="#e0f2fe"
              position={[-8, 4, 3]}
              scale={[12, 1.2, 1]}
              target={[0, 0, 0]}
            />
            {/* Lateral Right Warm Accent Strip */}
            <Lightformer
              form="rect"
              intensity={3.2}
              color="#fffbeb"
              position={[8, 4, -2]}
              scale={[12, 1.2, 1]}
              target={[0, 0, 0]}
            />
            {/* Front Intake & Propeller Hub Circular Ring Lightformer */}
            <Lightformer
              form="ring"
              intensity={5.5}
              color="#ffffff"
              position={[0, 1.5, 8]}
              scale={[5.5, 5.5, 1]}
              target={[0, 0, 0]}
            />
            {/* Rear Nozzle / Afterburner Rim Accent (Aviation Cyan) */}
            <Lightformer
              form="rect"
              intensity={3.5}
              color="#38bdf8"
              position={[0, 3, -9]}
              scale={[14, 2, 1]}
              target={[0, 0, 0]}
            />
            {/* Ground Undercarriage Bounce Reflection */}
            <Lightformer
              form="rect"
              intensity={1.1}
              color="#f8fafc"
              position={[0, -6, 0]}
              scale={[18, 18, 1]}
              target={[0, 0, 0]}
            />
          </group>
        )}

        {/* 2. PROPULSION TEST CELL PRESET (High-Contrast Tungsten & Mercury Vapor) */}
        {hdrPreset === "testcell" && (
          <group>
            {/* High-Key Top Industrial Flood */}
            <Lightformer
              form="rect"
              intensity={4.5}
              color="#e2e8f0"
              position={[0, 10, 0]}
              scale={[10, 10, 1]}
              target={[0, 0, 0]}
            />
            {/* Sodium Vapor Intake Glow (Simulates high-heat testbed front array) */}
            <Lightformer
              form="rect"
              intensity={4.8}
              color="#fed7aa"
              position={[6, 3, 5]}
              scale={[8, 3, 1]}
              target={[0, 0, 0]}
            />
            {/* Cool Industrial Blue Test Rig Flank Light */}
            <Lightformer
              form="rect"
              intensity={4.0}
              color="#93c5fd"
              position={[-7, 5, -4]}
              scale={[10, 2, 1]}
              target={[0, 0, 0]}
            />
            {/* Concentric Intake Inspection Ring */}
            <Lightformer
              form="ring"
              intensity={6.0}
              color="#f8fafc"
              position={[0, 0, 7]}
              scale={[4.5, 4.5, 1]}
              target={[0, 0, 0]}
            />
            {/* Deep Combustor Exhaust Backlight */}
            <Lightformer
              form="circle"
              intensity={4.2}
              color="#fdba74"
              position={[0, 1, -8]}
              scale={[6, 6, 1]}
              target={[0, 0, 0]}
            />
            {/* Concrete Test Floor Bounce */}
            <Lightformer
              form="rect"
              intensity={0.9}
              color="#94a3b8"
              position={[0, -6, 0]}
              scale={[16, 16, 1]}
              target={[0, 0, 0]}
            />
          </group>
        )}

        {/* 3. FLIGHTLINE / RUNWAY PRESET (Crisp Outdoor Sunlight & Horizon Gradient) */}
        {hdrPreset === "flightline" && (
          <group>
            {/* High Dynamic Direct Sunlight Disk */}
            <Lightformer
              form="circle"
              intensity={9.0}
              color="#fffbeb"
              position={[9, 12, 6]}
              scale={[3.5, 3.5, 1]}
              target={[0, 0, 0]}
            />
            {/* Open Sky Zenith Ambient Dome Fill */}
            <Lightformer
              form="rect"
              intensity={2.8}
              color="#bae6fd"
              position={[0, 14, 0]}
              scale={[24, 24, 1]}
              target={[0, 0, 0]}
            />
            {/* 360-Degree Tarmac Horizon Light Strip */}
            <Lightformer
              form="rect"
              intensity={2.5}
              color="#e2e8f0"
              position={[0, 1, -12]}
              scale={[32, 2.5, 1]}
              target={[0, 0, 0]}
            />
            {/* Runway Asphalt Ground Bounce */}
            <Lightformer
              form="rect"
              intensity={1.2}
              color="#cbd5e1"
              position={[0, -6, 0]}
              scale={[20, 20, 1]}
              target={[0, 0, 0]}
            />
            {/* Front Propeller Glint Accent */}
            <Lightformer
              form="ring"
              intensity={4.5}
              color="#ffffff"
              position={[0, 2, 7]}
              scale={[5, 5, 1]}
              target={[0, 0, 0]}
            />
          </group>
        )}

        {/* 4. METROLOGY CLEANROOM PRESET (Ultra-Even 360° Studio Diffusion) */}
        {hdrPreset === "cleanroom" && (
          <group>
            {/* Ceiling Full-Diffusion Light Grid */}
            <Lightformer
              form="rect"
              intensity={3.4}
              color="#ffffff"
              position={[0, 8, 0]}
              scale={[16, 16, 1]}
              target={[0, 0, 0]}
            />
            {/* 4-Corner Vertical Softbox Towers */}
            <Lightformer
              form="rect"
              intensity={3.0}
              color="#f8fafc"
              position={[-7, 4, 7]}
              scale={[3, 10, 1]}
              target={[0, 0, 0]}
            />
            <Lightformer
              form="rect"
              intensity={3.0}
              color="#f8fafc"
              position={[7, 4, 7]}
              scale={[3, 10, 1]}
              target={[0, 0, 0]}
            />
            <Lightformer
              form="rect"
              intensity={3.0}
              color="#f8fafc"
              position={[-7, 4, -7]}
              scale={[3, 10, 1]}
              target={[0, 0, 0]}
            />
            <Lightformer
              form="rect"
              intensity={3.0}
              color="#f8fafc"
              position={[7, 4, -7]}
              scale={[3, 10, 1]}
              target={[0, 0, 0]}
            />
            {/* Front Circular Specular Ring */}
            <Lightformer
              form="ring"
              intensity={5.0}
              color="#ffffff"
              position={[0, 0, 7]}
              scale={[6, 6, 1]}
              target={[0, 0, 0]}
            />
            {/* White Epoxy Floor Bounce */}
            <Lightformer
              form="rect"
              intensity={1.4}
              color="#ffffff"
              position={[0, -6, 0]}
              scale={[18, 18, 1]}
              target={[0, 0, 0]}
            />
          </group>
        )}
      </Environment>

      {/* Primary Key Light with Crisp CAD Casting Shadows */}
      <directionalLight
        position={[10, 15, 8]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />

      {/* Secondary Warm Fill Light */}
      <directionalLight
        position={[-8, 8, -6]}
        intensity={0.9}
        color="#fffbeb"
      />

      {/* Precision Aerospace Overhead Rim Light */}
      <directionalLight
        position={[0, 12, -8]}
        intensity={1.4}
        color="#e0f2fe"
      />

      {/* Ambient Fill Lighting */}
      <ambientLight intensity={0.4} color="#f8fafc" />

      {/* High-Resolution Soft Contact Shadows on Ground Plane */}
      <ContactShadows
        position={[0, -2.0, 0]}
        opacity={0.65}
        scale={22}
        blur={2.2}
        far={6}
        resolution={1024}
        color="#0f172a"
      />

      {/* Technical CAD Studio Grid */}
      {showGrid && (
        <group position={[0, -1.99, 0]}>
          <gridHelper args={[24, 24, "#94a3b8", "#e2e8f0"]} />
          {/* Subtle concentric radius rings for engineering presentation */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
            <ringGeometry args={[3.98, 4.02, 64]} />
            <meshBasicMaterial color="#cbd5e1" transparent opacity={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
            <ringGeometry args={[7.98, 8.02, 64]} />
            <meshBasicMaterial color="#e2e8f0" transparent opacity={0.4} />
          </mesh>
        </group>
      )}
    </>
  );
};
