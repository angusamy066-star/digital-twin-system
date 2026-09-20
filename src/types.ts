export type MissionPhase = "PREFLIGHT" | "TAKEOFF" | "CLIMB" | "CRUISE" | "DESCENT" | "LANDING";

export type FaultType = "none" | "overheat" | "oil_pressure" | "vibration" | "combustion" | "sensor_dropout";

export interface TelemetrySample {
  timestamp: string;
  engine_id: string;
  mission_id: string;
  mission_phase: MissionPhase;
  rpm: number;
  cht_c: number;
  egt_c: number;
  oil_pressure_kpa: number;
  oil_temperature_c: number;
  vibration_g: number;
  fuel_flow_lph: number;
  altitude_m: number;
  ambient_temperature_c: number;
  throttle_percent: number;
  // Diagnostics residuals
  residuals?: {
    rpm: number;
    cht: number;
    egt: number;
    oil_pressure: number;
    vibration: number;
    fuel_flow: number;
  };
  z_scores?: {
    rpm: number;
    cht: number;
    egt: number;
    oil_pressure: number;
    vibration: number;
  };
}

export interface ComponentHealth {
  thermal: number;      // 0-100%
  lubrication: number;  // 0-100%
  mechanical: number;   // 0-100%
  combustion: number;   // 0-100%
  power: number;        // 0-100%
}

export interface FaultProbabilities {
  overheating: number;
  lubrication_failure: number;
  bearing_degradation: number;
  combustion_instability: number;
}

export interface AlertItem {
  id: string;
  timestamp: string;
  severity: "info" | "warning" | "critical";
  type: "THERMAL" | "LUBRICATION" | "MECHANICAL" | "COMBUSTION" | "POWER" | "SENSOR";
  message: string;
  value?: number;
  threshold?: number;
  unit?: string;
  acknowledged?: boolean;
}

export interface DigitalTwinState {
  health_score: number;        // 0-100
  anomaly_score: number;       // 0-1
  rul_hours: number;           // estimated hours
  rul_uncertainty: {
    p10_hours: number;
    p50_hours: number;
    p90_hours: number;
  };
  mission_reliability: number; // 0-100%
  remaining_mission_hours: number;
  confidence: number;          // 0-1
  primary_risk: string;
  component_health: ComponentHealth;
  fault_probabilities: FaultProbabilities;
  alerts: AlertItem[];
  model_status: "demo_heuristic" | "validated_calibration";
  top_contributing_sensors: {
    sensor: string;
    label: string;
    residual: number;
    z_score: number;
    importance: number;
  }[];
  maintenance_action: {
    title: string;
    urgency: "LOW" | "ELEVATED" | "IMMEDIATE" | "CRITICAL";
    recommendation: string;
    ata_chapter: string;
  };
}

export interface EngineProfile {
  id: string;
  name: string;
  engine_type: string;
  airframe: string;
  total_operating_hours: number;
  limits: {
    cht: { warning: number; critical: number; normal_std: number };
    egt: { warning: number; critical: number; normal_std: number };
    oil_pressure: { warning: number; critical: number; normal_std: number };
    vibration: { warning: number; critical: number; normal_std: number };
    rpm: { max_continuous: number; redline: number; normal_std: number };
  };
}

export interface MissionInfo {
  id: string;
  aircraft_id: string;
  name: string;
  duration_planned_hours: number;
  elapsed_hours: number;
  phase: MissionPhase;
  status: "ACTIVE" | "COMPLETED" | "ABORTED";
  origin: string;
  destination: string;
}

export interface PartInfo {
  id: string;
  number: number;
  name: string;
  category: "Thermal" | "Lubrication" | "Mechanical" | "Combustion" | "Power" | "Avionics" | "Airframe";
  healthKey: keyof ComponentHealth;
  specs: string;
  material: string;
  positionOffset: [number, number, number];
}
