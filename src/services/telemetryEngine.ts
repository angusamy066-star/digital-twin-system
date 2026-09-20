import {
  TelemetrySample,
  DigitalTwinState,
  FaultType,
  EngineProfile,
  MissionInfo,
  AlertItem,
  ComponentHealth,
  FaultProbabilities
} from "../types";

export function clamp(value: number, min = 0.0, max = 1.0): number {
  return Math.max(min, Math.min(max, value));
}

export function highValueRisk(value: number, warningLimit: number, criticalLimit: number): number {
  if (value <= warningLimit) return 0;
  return clamp((value - warningLimit) / (criticalLimit - warningLimit));
}

export function lowValueRisk(value: number, warningLimit: number, criticalLimit: number): number {
  if (value >= warningLimit) return 0;
  return clamp((warningLimit - value) / (warningLimit - criticalLimit));
}

export function gaussianRandom(mean = 0, stdev = 1): number {
  const u1 = 1 - Math.random();
  const u2 = 1 - Math.random();
  const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + randStdNormal * stdev;
}

export interface TelemetryGenerationParams {
  engineId: string;
  missionId: string;
  elapsedSeconds: number;
  fault: FaultType;
  faultProgress: number; // 0.0 to 1.0
  profile: EngineProfile;
  ambientTemp?: number;
  altitude?: number;
  throttle?: number;
  dropoutEnabled?: boolean;
}

export function generateTelemetrySample(params: TelemetryGenerationParams): TelemetrySample {
  const {
    engineId,
    missionId,
    elapsedSeconds: t,
    fault,
    faultProgress,
    ambientTemp = 19.4,
    altitude = 3200,
    throttle = 64.2,
    dropoutEnabled = false
  } = params;

  // Base physics dynamics
  let rpm = 2380 + 55 * Math.sin(t / 7) + gaussianRandom(0, 7.5);
  let cht = 165 + 4 * Math.sin(t / 9) + gaussianRandom(0, 1.2);
  let egt = 710 + 10 * Math.sin(t / 10) + gaussianRandom(0, 2.8);
  let oilPressure = 420 + 6 * Math.sin(t / 8) + gaussianRandom(0, 2.1);
  let oilTemp = 91 + 2 * Math.sin(t / 14) + gaussianRandom(0, 0.6);
  let vibration = 0.22 + Math.abs(0.02 * Math.sin(t / 5)) + gaussianRandom(0, 0.012);
  let fuelFlow = 18 + 0.8 * Math.sin(t / 8) + gaussianRandom(0, 0.18);

  // Environmental coupling
  cht += (ambientTemp - 19) * 0.4;
  egt += (throttle - 60) * 1.5;

  // Fault injections
  if (fault === "overheat") {
    cht += 52 * faultProgress;
    egt += 145 * faultProgress;
    oilTemp += 22 * faultProgress;
  } else if (fault === "oil_pressure") {
    oilPressure -= 215 * faultProgress;
    oilTemp += 14 * faultProgress;
  } else if (fault === "vibration") {
    vibration += 0.68 * faultProgress;
    rpm += gaussianRandom(0, 18 * faultProgress);
  } else if (fault === "combustion") {
    egt += 75 * Math.sin(t * 1.5) * faultProgress;
    rpm += 90 * Math.cos(t * 1.2) * faultProgress;
    fuelFlow += 4.5 * faultProgress;
  }

  // Dropout / sensor fault
  let finalCht = Math.round(cht * 10) / 10;
  let finalOilPressure = Math.round(oilPressure * 10) / 10;
  if (fault === "sensor_dropout" || (dropoutEnabled && Math.random() < 0.04)) {
    // Inject packet loss or out-of-range sensor spike
    finalOilPressure = -999; // Sentinel / dropout
  }

  return {
    timestamp: new Date().toISOString(),
    engine_id: engineId,
    mission_id: missionId,
    mission_phase: "CRUISE",
    rpm: Math.round(rpm),
    cht_c: finalCht,
    egt_c: Math.round(egt * 10) / 10,
    oil_pressure_kpa: finalOilPressure,
    oil_temperature_c: Math.round(oilTemp * 10) / 10,
    vibration_g: Math.round(Math.max(0, vibration) * 1000) / 1000,
    fuel_flow_lph: Math.round(fuelFlow * 10) / 10,
    altitude_m: altitude,
    ambient_temperature_c: ambientTemp,
    throttle_percent: throttle,
  };
}

export function computeDigitalTwin(
  telemetry: TelemetrySample,
  profile: EngineProfile,
  remainingMissionHours = 2.2,
  validatedMode = false
): DigitalTwinState {
  const limits = profile.limits;

  // Regime-aware expected baselines
  const expectedRpm = 2380 + (telemetry.throttle_percent - 64) * 25;
  const expectedCht = 165 + (telemetry.ambient_temperature_c - 19) * 0.4;
  const expectedEgt = 710 + (telemetry.throttle_percent - 64) * 1.5;
  const expectedOilPressure = 420;
  const expectedVibration = 0.22;
  const expectedFuelFlow = 18.0 + (telemetry.throttle_percent - 64) * 0.3;

  // Residuals
  const actualOilP = telemetry.oil_pressure_kpa < 0 ? 350 : telemetry.oil_pressure_kpa;
  const resRpm = telemetry.rpm - expectedRpm;
  const resCht = telemetry.cht_c - expectedCht;
  const resEgt = telemetry.egt_c - expectedEgt;
  const resOilP = actualOilP - expectedOilPressure;
  const resVib = telemetry.vibration_g - expectedVibration;
  const resFuel = telemetry.fuel_flow_lph - expectedFuelFlow;

  // Normalized z-scores
  const zRpm = resRpm / limits.rpm.normal_std;
  const zCht = resCht / limits.cht.normal_std;
  const zEgt = resEgt / limits.egt.normal_std;
  const zOilP = resOilP / limits.oil_pressure.normal_std;
  const zVib = resVib / limits.vibration.normal_std;

  // Component risks
  const thermalChtRisk = highValueRisk(telemetry.cht_c, limits.cht.warning, limits.cht.critical);
  const thermalEgtRisk = highValueRisk(telemetry.egt_c, limits.egt.warning, limits.egt.critical);
  const thermalRisk = clamp(0.55 * thermalChtRisk + 0.45 * thermalEgtRisk, 0, 1);

  const oilRisk = lowValueRisk(actualOilP, limits.oil_pressure.warning, limits.oil_pressure.critical);

  const vibrationRisk = highValueRisk(telemetry.vibration_g, limits.vibration.warning, limits.vibration.critical);
  const rpmInstabilityRisk = clamp(Math.abs(zRpm) / 4.0, 0, 1);
  const mechanicalRisk = clamp(0.70 * vibrationRisk + 0.30 * rpmInstabilityRisk, 0, 1);

  const combustionRisk = clamp(0.65 * thermalEgtRisk + 0.35 * clamp(Math.abs(resFuel) / 4.0, 0, 1), 0, 1);
  const powerRisk = clamp(0.5 * rpmInstabilityRisk + 0.5 * mechanicalRisk, 0, 1);

  // Overall Risk
  const overallRisk = clamp(
    0.35 * thermalRisk +
    0.25 * oilRisk +
    0.25 * mechanicalRisk +
    0.15 * combustionRisk,
    0,
    1
  );

  const healthScore = Math.round(100 * (1 - overallRisk) * 10) / 10;
  const anomalyScore = Math.round(overallRisk * 1000) / 1000;

  // RUL estimate
  const baseRul = Math.max(0.5, 300 * (healthScore / 100));
  const rulHours = Math.round(baseRul * 10) / 10;
  const rulUncertainty = {
    p10_hours: Math.round(rulHours * 0.73 * 10) / 10,
    p50_hours: rulHours,
    p90_hours: Math.round(rulHours * 1.32 * 10) / 10,
  };

  // Mission Reliability
  const hazardRate = 0.05 * overallRisk + 0.005;
  const missionReliability = Math.round(100 * Math.exp(-hazardRate * remainingMissionHours) * 10) / 10;

  // Confidence
  const confidence = Math.round((0.88 - overallRisk * 0.18 + (validatedMode ? 0.08 : 0)) * 100) / 100;

  // Component Health
  const componentHealth: ComponentHealth = {
    thermal: Math.round(100 * (1 - thermalRisk) * 10) / 10,
    lubrication: Math.round(100 * (1 - oilRisk) * 10) / 10,
    mechanical: Math.round(100 * (1 - mechanicalRisk) * 10) / 10,
    combustion: Math.round(100 * (1 - combustionRisk) * 10) / 10,
    power: Math.round(100 * (1 - powerRisk) * 10) / 10,
  };

  // Fault probabilities
  const faultProbabilities: FaultProbabilities = {
    overheating: Math.round(thermalRisk * 1000) / 1000,
    lubrication_failure: Math.round(oilRisk * 1000) / 1000,
    bearing_degradation: Math.round(vibrationRisk * 1000) / 1000,
    combustion_instability: Math.round(combustionRisk * 1000) / 1000,
  };

  // Primary risk description
  let primaryRisk = "All parameters nominal";
  if (thermalRisk >= oilRisk && thermalRisk >= vibrationRisk && thermalRisk > 0.3) {
    primaryRisk = `Thermal loading anomaly (${thermalRisk > 0.7 ? 'Critical' : 'Elevated'} CHT/EGT)`;
  } else if (oilRisk >= thermalRisk && oilRisk >= vibrationRisk && oilRisk > 0.3) {
    primaryRisk = `Lubrication decay (Oil pressure: ${Math.round(actualOilP)} kPa, residual ${Math.round(zOilP * 10) / 10}σ)`;
  } else if (vibrationRisk > 0.3) {
    primaryRisk = `Increasing mechanical vibration trend (${telemetry.vibration_g.toFixed(2)}g peak)`;
  } else if (combustionRisk > 0.4) {
    primaryRisk = `Combustion chamber instability / EGT divergence`;
  }

  // Alerts
  const alerts: AlertItem[] = [];
  const nowStr = new Date().toLocaleTimeString();

  if (telemetry.oil_pressure_kpa < 0) {
    alerts.push({
      id: "alt-dropout",
      timestamp: nowStr,
      severity: "warning",
      type: "SENSOR",
      message: "Telemetry sensor dropout detected on oil pressure channel. Reconstructing with Kalman estimator.",
      unit: "kPa"
    });
  }

  if (thermalRisk > 0.65) {
    alerts.push({
      id: "alt-thermal",
      timestamp: nowStr,
      severity: thermalRisk > 0.85 ? "critical" : "warning",
      type: "THERMAL",
      message: thermalRisk > 0.85
        ? `CRITICAL OVERHEAT: Cylinder Head Temp at ${telemetry.cht_c}°C (Ceiling: ${limits.cht.critical}°C)`
        : `Thermal warning: CHT ${telemetry.cht_c}°C exceeds nominal envelope`,
      value: telemetry.cht_c,
      threshold: limits.cht.warning,
      unit: "°C"
    });
  }

  if (oilRisk > 0.65) {
    alerts.push({
      id: "alt-lubrication",
      timestamp: nowStr,
      severity: oilRisk > 0.85 ? "critical" : "warning",
      type: "LUBRICATION",
      message: oilRisk > 0.85
        ? `CRITICAL OIL DEPRESSURIZATION: Sump pressure at ${Math.round(actualOilP)} kPa (Floor: ${limits.oil_pressure.critical} kPa)`
        : `Lubrication warning: Oil pressure ${Math.round(actualOilP)} kPa below 350 kPa envelope`,
      value: actualOilP,
      threshold: limits.oil_pressure.warning,
      unit: "kPa"
    });
  }

  if (vibrationRisk > 0.65) {
    alerts.push({
      id: "alt-mechanical",
      timestamp: nowStr,
      severity: vibrationRisk > 0.85 ? "critical" : "warning",
      type: "MECHANICAL",
      message: vibrationRisk > 0.85
        ? `CRITICAL VIBRATION: Mechanical load ${telemetry.vibration_g}g indicates rotor/bearing spalling`
        : `Mechanical warning: Vibration amplitude ${telemetry.vibration_g}g exceeds 0.40g threshold`,
      value: telemetry.vibration_g,
      threshold: limits.vibration.warning,
      unit: "g"
    });
  }

  // Top Contributing Sensors
  const topContributingSensors = [
    {
      sensor: "oil_pressure",
      label: "Oil Pressure (kPa)",
      residual: Math.round(resOilP * 10) / 10,
      z_score: Math.round(zOilP * 100) / 100,
      importance: Math.min(100, Math.round(Math.abs(zOilP) * 22))
    },
    {
      sensor: "vibration",
      label: "Vibration Load (g)",
      residual: Math.round(resVib * 1000) / 1000,
      z_score: Math.round(zVib * 100) / 100,
      importance: Math.min(100, Math.round(Math.abs(zVib) * 25))
    },
    {
      sensor: "cht",
      label: "Cylinder Head Temp (°C)",
      residual: Math.round(resCht * 10) / 10,
      z_score: Math.round(zCht * 100) / 100,
      importance: Math.min(100, Math.round(Math.abs(zCht) * 18))
    },
    {
      sensor: "egt",
      label: "Exhaust Gas Temp (°C)",
      residual: Math.round(resEgt * 10) / 10,
      z_score: Math.round(zEgt * 100) / 100,
      importance: Math.min(100, Math.round(Math.abs(zEgt) * 14))
    },
    {
      sensor: "rpm",
      label: "RPM Stability",
      residual: Math.round(resRpm * 10) / 10,
      z_score: Math.round(zRpm * 100) / 100,
      importance: Math.min(100, Math.round(Math.abs(zRpm) * 10))
    }
  ].sort((a, b) => b.importance - a.importance);

  // Recommended Maintenance Action
  let maintenanceAction: {
    title: string;
    urgency: "LOW" | "ELEVATED" | "IMMEDIATE" | "CRITICAL";
    recommendation: string;
    ata_chapter: string;
  } = {
    title: "Routine Turnaround Inspection",
    urgency: "LOW",
    recommendation: "Engine operating within calibrated DRDO envelope. Continue normal scheduled sortie check.",
    ata_chapter: "ATA 71 - Power Plant General"
  };

  if (oilRisk > 0.7) {
    maintenanceAction = {
      title: "Lubrication Subsystem Flush & Pressure Relief Valve Servicing",
      urgency: oilRisk > 0.85 ? "CRITICAL" : "IMMEDIATE",
      recommendation: "Inspect oil sump magnetic chip detector for metallic debris. Service scavenge pump and oil filter element.",
      ata_chapter: "ATA 79 - Engine Oil System"
    };
  } else if (thermalRisk > 0.7) {
    maintenanceAction = {
      title: "Thermal Baffling & Cowling Cooling Passage Inspection",
      urgency: thermalRisk > 0.85 ? "CRITICAL" : "IMMEDIATE",
      recommendation: "Verify cylinder head cooling cowl seals. Inspect fuel injection nozzles for lean fuel distribution.",
      ata_chapter: "ATA 75 - Air Cooling & Bleed"
    };
  } else if (vibrationRisk > 0.7) {
    maintenanceAction = {
      title: "Dynamic Rotor & Propeller Balance / Bearings Acoustic Audit",
      urgency: vibrationRisk > 0.85 ? "CRITICAL" : "ELEVATED",
      recommendation: "Perform spectral FFT vibration analysis on shaft 1X/2X harmonics. Inspect engine mount isolators.",
      ata_chapter: "ATA 72 - Engine Structural & Rotating Assembly"
    };
  }

  return {
    health_score: healthScore,
    anomaly_score: anomalyScore,
    rul_hours: rulHours,
    rul_uncertainty: rulUncertainty,
    mission_reliability: missionReliability,
    remaining_mission_hours: remainingMissionHours,
    confidence: confidence,
    primary_risk: primaryRisk,
    component_health: componentHealth,
    fault_probabilities: faultProbabilities,
    alerts: alerts,
    model_status: validatedMode ? "validated_calibration" : "demo_heuristic",
    top_contributing_sensors: topContributingSensors,
    maintenance_action: maintenanceAction
  };
}

export function generateSyntheticTelemetry(
  profile: EngineProfile,
  mission: MissionInfo,
  fault: FaultType,
  step: number
): TelemetrySample {
  return generateTelemetrySample({
    engineId: profile.id,
    missionId: mission.id,
    elapsedSeconds: step * 1.0,
    fault: fault,
    faultProgress: fault === "none" ? 0 : Math.min(1.0, 0.2 + (step % 50) * 0.03),
    profile: profile,
    ambientTemp: 19.4,
    altitude: 3200,
    throttle: 64.2
  });
}

