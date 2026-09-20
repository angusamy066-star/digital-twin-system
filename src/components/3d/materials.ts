import * as THREE from "three";
import { ComponentHealth } from "../../types";

// Canvas texture generator for authentic twill weave Carbon Fiber
export function createCarbonFiberTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#1e2229";
    ctx.fillRect(0, 0, size, size);

    const step = 8;
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        const isLight = ((x / step) + (y / step)) % 2 === 0;
        ctx.fillStyle = isLight ? "#2a303c" : "#14171d";
        ctx.fillRect(x, y, step, step);

        // Micro-weave diagonal highlights
        ctx.fillStyle = isLight ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.15)";
        ctx.beginPath();
        ctx.moveTo(x, y + step);
        ctx.lineTo(x + step, y);
        ctx.stroke();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// Canvas texture generator for diamond knurled metal grip
export function createKnurledMetalTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, size, size);

    ctx.lineWidth = 1.5;
    for (let i = -size; i < size * 2; i += 8) {
      ctx.strokeStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
      ctx.stroke();

      ctx.strokeStyle = "#222222";
      ctx.beginPath();
      ctx.moveTo(i + size, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

// Singletons for textures
let cachedCarbonTex: THREE.CanvasTexture | null = null;
let cachedKnurledTex: THREE.CanvasTexture | null = null;

export function getCarbonTexture(): THREE.CanvasTexture {
  if (!cachedCarbonTex && typeof document !== "undefined") {
    cachedCarbonTex = createCarbonFiberTexture();
  }
  return cachedCarbonTex!;
}

export function getKnurledTexture(): THREE.CanvasTexture {
  if (!cachedKnurledTex && typeof document !== "undefined") {
    cachedKnurledTex = createKnurledMetalTexture();
  }
  return cachedKnurledTex!;
}

// Material creation helpers for PBR Industrial Rendering
export interface PBRMaterialProps {
  metalness?: number;
  roughness?: number;
  color?: string | number;
  emissive?: string | number;
  emissiveIntensity?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  envMapIntensity?: number;
  transmission?: number;
  ior?: number;
  wireframe?: boolean;
  transparent?: boolean;
  opacity?: number;
  bumpMap?: THREE.Texture;
  bumpScale?: number;
}

// Standard PBR Presets
export const PBR_PRESETS: Record<string, PBRMaterialProps> = {
  // Aircraft Grade Titanium (Ti-6Al-4V)
  titanium: {
    color: "#d1d5db",
    metalness: 0.94,
    roughness: 0.16,
    clearcoat: 0.45,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.45,
  },
  // Dark Machined Titanium for turbine blades & stators
  titaniumDark: {
    color: "#4b5563",
    metalness: 0.95,
    roughness: 0.20,
    clearcoat: 0.35,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.35,
  },
  // High-Grade Brushed Aviation Aluminum (Al 7075)
  aluminum: {
    color: "#e2e8f0",
    metalness: 0.88,
    roughness: 0.22,
    clearcoat: 0.28,
    clearcoatRoughness: 0.20,
    envMapIntensity: 1.3,
  },
  // Chrome / Mirror Polish Bearing Steel
  chrome: {
    color: "#f8fafc",
    metalness: 0.99,
    roughness: 0.04,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 2.0,
  },
  // Inconel 718 Nickel Superalloy (Combustor / Hot Section)
  inconel: {
    color: "#52525b",
    metalness: 0.90,
    roughness: 0.32,
    clearcoat: 0.22,
    clearcoatRoughness: 0.25,
    envMapIntensity: 1.25,
  },
  // Heat-treated Exhaust Temper Alloy (Subtle iridescent bronze/blue tone)
  heatTreatedAlloy: {
    color: "#9a8c73",
    metalness: 0.92,
    roughness: 0.24,
    clearcoat: 0.38,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.35,
  },
  // Anodized Aviation Orange (Motors, wiring, testbed accents)
  anodizedOrange: {
    color: "#f97316",
    metalness: 0.86,
    roughness: 0.18,
    clearcoat: 0.65,
    clearcoatRoughness: 0.10,
    envMapIntensity: 1.4,
  },
  // Anodized Aviation Blue (Hydraulics & Fuel lines)
  anodizedBlue: {
    color: "#2563eb",
    metalness: 0.88,
    roughness: 0.18,
    clearcoat: 0.65,
    clearcoatRoughness: 0.10,
    envMapIntensity: 1.4,
  },
  // High-Torque Copper Motor Windings
  copperWinding: {
    color: "#b45309",
    metalness: 0.90,
    roughness: 0.22,
    clearcoat: 0.40,
    envMapIntensity: 1.35,
  },
  // Matte Tactical Carbon Fiber Body
  carbonComposite: {
    color: "#18181b",
    metalness: 0.30,
    roughness: 0.35,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
    envMapIntensity: 0.95,
  },
  // Rugged High-Density Polymer (Pelican battery case)
  heavyPolymer: {
    color: "#1c1917",
    metalness: 0.12,
    roughness: 0.55,
    envMapIntensity: 0.7,
  },
  // Optical Sensor Sapphire Glass
  sapphireGlass: {
    color: "#38bdf8",
    metalness: 0.10,
    roughness: 0.04,
    transmission: 0.85,
    ior: 1.76,
    transparent: true,
    opacity: 0.65,
    envMapIntensity: 1.8,
  },
  // Combustor Flame Core
  flameCore: {
    color: "#ff6a00",
    emissive: "#ff4500",
    emissiveIntensity: 3.5,
    transparent: true,
    opacity: 0.85,
    envMapIntensity: 0.2,
  }
};

// Helper to determine component color in Health Tint Mode
export function getHealthTintColor(health: number): string {
  if (health >= 85) return "#10b981"; // Emerald green
  if (health >= 70) return "#84cc16"; // Lime
  if (health >= 55) return "#eab308"; // Amber
  if (health >= 35) return "#f97316"; // Orange
  return "#ef4444"; // Red critical
}
