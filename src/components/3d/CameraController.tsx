import React, { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export type ViewAngle =
  | "iso"
  | "top"
  | "front"
  | "side"
  | "rear"
  | "cutaway"
  | "gearbox"
  | "detail-radar"
  | "detail-motor"
  | "detail-fc"
  | "detail-battery"
  | "detail-gear";

interface CameraControllerProps {
  currentView: ViewAngle;
  autoRotate: boolean;
}

const VIEW_PRESETS: Record<ViewAngle, { pos: [number, number, number]; target: [number, number, number] }> = {
  iso: { pos: [5.5, 3.8, 6.2], target: [0, 0, 0] },
  top: { pos: [0, 9.5, 0.01], target: [0, 0, 0] },
  front: { pos: [0, 0.8, 8.2], target: [0, 0, 0] },
  side: { pos: [8.5, 1.0, 0], target: [0, 0, 0] },
  rear: { pos: [0, 1.2, -8.5], target: [0, 0, 0] },
  cutaway: { pos: [4.2, 2.6, 5.0], target: [0, 0, 0] },
  gearbox: { pos: [-3.5, 2.5, 3.5], target: [-0.5, -0.8, 0] },
  "detail-radar": { pos: [0, 3.2, 2.2], target: [0, 1.2, 0] },
  "detail-motor": { pos: [3.8, 2.2, 2.2], target: [2.5, 0.4, 0] },
  "detail-fc": { pos: [0, 2.8, 0.2], target: [0, 0.4, 0] },
  "detail-battery": { pos: [1.8, 0.8, 2.8], target: [0.6, -0.2, 0] },
  "detail-gear": { pos: [2.2, -0.8, 3.2], target: [0, -1.0, 0] },
};

export const CameraController: React.FC<CameraControllerProps> = ({ currentView, autoRotate }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const targetCamPos = useRef(new THREE.Vector3(...VIEW_PRESETS.iso.pos));
  const targetLookAt = useRef(new THREE.Vector3(...VIEW_PRESETS.iso.target));
  const isTransitioning = useRef(false);

  useEffect(() => {
    const preset = VIEW_PRESETS[currentView] || VIEW_PRESETS.iso;
    targetCamPos.current.set(...preset.pos);
    targetLookAt.current.set(...preset.target);
    isTransitioning.current = true;
  }, [currentView]);

  useFrame(({ camera }) => {
    if (isTransitioning.current && controlsRef.current) {
      camera.position.lerp(targetCamPos.current, 0.08);
      controlsRef.current.target.lerp(targetLookAt.current, 0.08);
      controlsRef.current.update();

      if (
        camera.position.distanceTo(targetCamPos.current) < 0.05 &&
        controlsRef.current.target.distanceTo(targetLookAt.current) < 0.05
      ) {
        camera.position.copy(targetCamPos.current);
        controlsRef.current.target.copy(targetLookAt.current);
        isTransitioning.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      autoRotate={autoRotate}
      autoRotateSpeed={1.5}
      enableDamping
      dampingFactor={0.06}
      minDistance={1.5}
      maxDistance={25}
      maxPolarAngle={Math.PI / 2 + 0.05} // Don't clip below floor
    />
  );
};
