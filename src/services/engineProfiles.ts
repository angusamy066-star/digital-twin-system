import { EngineProfile, MissionInfo, PartInfo } from "../types";

export const DEFAULT_PROFILES: EngineProfile[] = [
  {
    id: "ENG-001",
    name: "Hum3D Skyfall #001 (Multi-Rotor VTOL Drone)",
    engine_type: "heavy_vtol_propulsion",
    airframe: "Skyfall #001 Heavy Hexacopter VTOL Platform",
    total_operating_hours: 142.6,
    limits: {
      cht: { warning: 180, critical: 215, normal_std: 4.5 },
      egt: { warning: 760, critical: 900, normal_std: 12.0 },
      oil_pressure: { warning: 350, critical: 250, normal_std: 15.0 },
      vibration: { warning: 0.40, critical: 0.90, normal_std: 0.04 },
      rpm: { max_continuous: 2600, redline: 2850, normal_std: 35.0 },
    }
  },
  {
    id: "ENG-002",
    name: "DRDO SIH-26054 Testbed Unit B",
    engine_type: "rotary_aero_engine",
    airframe: "DRDO Autonomous Scout airframe",
    total_operating_hours: 318.4,
    limits: {
      cht: { warning: 175, critical: 205, normal_std: 4.0 },
      egt: { warning: 780, critical: 920, normal_std: 14.0 },
      oil_pressure: { warning: 370, critical: 260, normal_std: 12.0 },
      vibration: { warning: 0.38, critical: 0.85, normal_std: 0.035 },
      rpm: { max_continuous: 2700, redline: 3000, normal_std: 40.0 },
    }
  },
  {
    id: "ENG-003",
    name: "AeroTwin TP-120 Turboprop",
    engine_type: "small_turboprop_drone",
    airframe: "High Altitude Long Endurance (HALE)",
    total_operating_hours: 89.2,
    limits: {
      cht: { warning: 190, critical: 230, normal_std: 5.0 },
      egt: { warning: 750, critical: 880, normal_std: 10.0 },
      oil_pressure: { warning: 340, critical: 240, normal_std: 16.0 },
      vibration: { warning: 0.45, critical: 0.95, normal_std: 0.05 },
      rpm: { max_continuous: 2550, redline: 2800, normal_std: 30.0 },
    }
  }
];

export const TURBINE_PARTS_CATALOG: PartInfo[] = [
  {
    id: "turb-1",
    number: 1,
    name: "Aerodynamic Spinner & Nose Cone",
    category: "Airframe",
    healthKey: "mechanical",
    specs: "Titanium Grade 5 aerodynamic nose with anti-ice vortex spiral",
    material: "Ti-6Al-4V Forged Titanium",
    positionOffset: [0, 0, 1.8]
  },
  {
    id: "turb-2",
    number: 2,
    name: "Low-Pressure Axial Fan / Intake Blisk",
    category: "Mechanical",
    healthKey: "mechanical",
    specs: "24-blade wide-chord integrally bladed rotor (Blisk)",
    material: "Ti-6Al-4V Solid Airfoil Blades",
    positionOffset: [0, 0, 1.3]
  },
  {
    id: "turb-3",
    number: 3,
    name: "Multi-Stage HP Axial Compressor",
    category: "Mechanical",
    healthKey: "mechanical",
    specs: "4-stage high-pressure rotor blisks & inter-stage stator guide vanes",
    material: "Inconel 718 Superalloy & Ceramic Coating",
    positionOffset: [0, 0, 0.75]
  },
  {
    id: "turb-4",
    number: 4,
    name: "Central Spool Driveshaft & Labyrinth Seals",
    category: "Mechanical",
    healthKey: "mechanical",
    specs: "Dynamically balanced dual-spool coaxial torque driveshaft",
    material: "Maraging 300 High-Tensile Steel",
    positionOffset: [0, 0, 0.0]
  },
  {
    id: "turb-5",
    number: 5,
    name: "Dual Roller Bearings & Squeeze-Film Dampers",
    category: "Lubrication",
    healthKey: "lubrication",
    specs: "Hybrid ceramic ball & cylindrical roller bearings with pressure oil feed",
    material: "Silicon Nitride (Si3N4) & M50 Tool Steel",
    positionOffset: [0, 0.1, 0.5]
  },
  {
    id: "turb-6",
    number: 6,
    name: "Annular Combustor & 12x Swirl Fuel Nozzles",
    category: "Combustion",
    healthKey: "combustion",
    specs: "Continuous annular reverse-flow flame tube with 12 duplex atomizers",
    material: "Hastelloy-X with Yttria-Stabilized Zirconia TBC",
    positionOffset: [0, 0, -0.05]
  },
  {
    id: "turb-7",
    number: 7,
    name: "High-Pressure Gas Generator Turbine",
    category: "Thermal",
    healthKey: "thermal",
    specs: "Single-crystal cooled turbine stage operating up to 1,350°C",
    material: "CMSX-4 Single Crystal Superalloy",
    positionOffset: [0, 0, -0.65]
  },
  {
    id: "turb-8",
    number: 8,
    name: "Low-Pressure Power Turbine Stage",
    category: "Thermal",
    healthKey: "thermal",
    specs: "2-stage axial free power turbine connected to output flange",
    material: "Rene 80 Vacuum-Cast Nickel Alloy",
    positionOffset: [0, 0, -1.05]
  },
  {
    id: "turb-9",
    number: 9,
    name: "Convergent Exhaust Nozzle & Tailcone",
    category: "Airframe",
    healthKey: "thermal",
    specs: "Aerodynamic gas exhaust collector with 4-strut bullet centerbody",
    material: "Titanium Honeycomb Sandwich Sheet",
    positionOffset: [0, 0, -1.55]
  },
  {
    id: "turb-10",
    number: 10,
    name: "Accessory Gearbox (AGB) & Scavenge Pump",
    category: "Lubrication",
    healthKey: "lubrication",
    specs: "Bottom-mounted casing with bevel gear train & 3-element scavenge pump",
    material: "Cast QE22A Magnesium-Rare Earth Alloy",
    positionOffset: [0, -0.7, 0.2]
  },
  {
    id: "turb-11",
    number: 11,
    name: "Dual-Channel FADEC ECU & Fuel Metering",
    category: "Avionics",
    healthKey: "power",
    specs: "DO-178C Level A dual-redundant digital engine control with heatsink",
    material: "CNC 6061-T6 Aluminum with Electroless Nickel Plating",
    positionOffset: [0.65, -0.6, 0.35]
  },
  {
    id: "turb-12",
    number: 12,
    name: "Stainless Braided Hydraulic & Fuel Conduits",
    category: "Lubrication",
    healthKey: "lubrication",
    specs: "Mil-DTL-83797 Teflon-lined stainless braided lines with gold AN fittings",
    material: "PTFE Core & AISI 304 Stainless Braid",
    positionOffset: [-0.45, -0.4, 0.1]
  },
  {
    id: "turb-13",
    number: 13,
    name: "Outer Titanium Nacelle Casing & Cutaway",
    category: "Airframe",
    healthKey: "mechanical",
    specs: "Aerodynamic nacelle enclosure with inspection latches & cutaway door",
    material: "Ti-6Al-4V Titanium Alloy & Carbon Composite",
    positionOffset: [0, 0.8, 0]
  }
];

export const UAV_PARTS_CATALOG: PartInfo[] = [
  {
    id: "uav-1",
    number: 1,
    name: "Radar / Sensor Dome",
    category: "Avionics",
    healthKey: "power",
    specs: "High-Gain Ka-Band Radar Scanner & Omni-Directional Sensor Radome with Knurled Shield",
    material: "Forged Carbon Shell & Titanium Mounting Ring",
    positionOffset: [0, 2.2, 0]
  },
  {
    id: "uav-2",
    number: 2,
    name: "Gimbal Mount",
    category: "Mechanical",
    healthKey: "mechanical",
    specs: "3-Axis Direct Drive Stabilized Gimbal Head with Orange Flex Harness",
    material: "CNC Machined 7075-T6 Aerospace Aluminum",
    positionOffset: [0, 1.7, 0]
  },
  {
    id: "uav-3",
    number: 3,
    name: "Upper Body Cover",
    category: "Airframe",
    healthKey: "thermal",
    specs: "Faceted Polygonal Carbon Cowling with Chamfered Perimeter & Quick-Release Flange",
    material: "Pre-Preg Toray Carbon Fiber Composite",
    positionOffset: [0, 1.25, 0]
  },
  {
    id: "uav-4",
    number: 4,
    name: "Propeller (x6)",
    category: "Mechanical",
    healthKey: "mechanical",
    specs: "Folding 2-Blade High-Aspect Ratio Carbon Airfoils with Dual-Pin Hub Clamp",
    material: "Aerodynamic High-Modulus Carbon Fiber",
    positionOffset: [0, 0.7, 0]
  },
  {
    id: "uav-5",
    number: 5,
    name: "Brushless Motor (x6)",
    category: "Power",
    healthKey: "power",
    specs: "Heavy-Duty Outrunner Motors with Anodized Orange Stator Ring & Standoff Bolts",
    material: "Neodymium N52SH Magnets & Anodized Orange Stator",
    positionOffset: [0, 0.5, 0]
  },
  {
    id: "uav-6",
    number: 6,
    name: "Arm (x6)",
    category: "Mechanical",
    healthKey: "mechanical",
    specs: "Rectangular Carbon Fiber Booms with Dual CNC Aluminum Sleeve Clamps",
    material: "T800 Rectangular Carbon Tube & Billet Aluminum Clamps",
    positionOffset: [0, 0.35, 0]
  },
  {
    id: "uav-7",
    number: 7,
    name: "Flight Controller",
    category: "Combustion",
    healthKey: "combustion",
    specs: "Triple-Redundant Autopilot Deck with Orange Silicone Wiring Harness Routing",
    material: "CNC Anodized Enclosure & Gold-Plated PCB Connectors",
    positionOffset: [0, 0.1, 0]
  },
  {
    id: "uav-8",
    number: 8,
    name: "Battery Pack (x2)",
    category: "Power",
    healthKey: "power",
    specs: "Industrial Pelican-Style Rugged Battery Enclosures with Latches & Center Straps",
    material: "Reinforced Impact Polycarbonate & Titanium Latches",
    positionOffset: [0, -0.15, 0]
  },
  {
    id: "uav-9",
    number: 9,
    name: "Side Body Panel (x4)",
    category: "Thermal",
    healthKey: "thermal",
    specs: "Faceted Aerodynamic Protective Armor Panels with Corner Fastener Hardware",
    material: "Carbon Composite & Aluminum Mounting Brackets",
    positionOffset: [0, -0.35, 0]
  },
  {
    id: "uav-10",
    number: 10,
    name: "Payload / Cargo Bay",
    category: "Lubrication",
    healthKey: "lubrication",
    specs: "Cylindrical Core with Structural Tie-Rods & 4 Radial Detachable Transceiver Pods",
    material: "Machined Aluminum Shell & Observation Port",
    positionOffset: [0, -0.65, 0]
  },
  {
    id: "uav-11",
    number: 11,
    name: "Landing Gear (x2)",
    category: "Airframe",
    healthKey: "mechanical",
    specs: "A-Frame Carbon Tubular Struts, CNC Joint Clamps, Crossbar, & Rubber Foot Pads",
    material: "Carbon Fiber Tubing, CNC Clamps, & Rubber Dampers",
    positionOffset: [0, -1.3, 0]
  }
];

export const BOXER_PARTS_CATALOG: PartInfo[] = [
  {
    id: "box-1",
    number: 1,
    name: "Twin Opposed Finned Cylinders",
    category: "Thermal",
    healthKey: "thermal",
    specs: "Cast aluminum cylinder barrels with 16 deep CNC cooling fins",
    material: "Alusil Cast Aluminum & Ceramic Bore",
    positionOffset: [1.2, 0, 0]
  },
  {
    id: "box-2",
    number: 2,
    name: "Cylinder Heads & Dual Spark Plugs",
    category: "Combustion",
    healthKey: "combustion",
    specs: "Dual-plug ignition cylinder heads with hemispherical chamber",
    material: "A356 Aerospace Grade Cast Aluminum",
    positionOffset: [1.6, 0, 0]
  },
  {
    id: "box-3",
    number: 3,
    name: "Stainless Steel Tuned Exhaust Headers",
    category: "Thermal",
    healthKey: "thermal",
    specs: "Mandrel-bent equal-length exhaust runners with thermal ceramic wrap",
    material: "AISI 321 Stabilized Stainless Steel",
    positionOffset: [0, -0.7, 0.4]
  },
  {
    id: "box-4",
    number: 4,
    name: "Propeller Hub Drive Flange & Crankshaft",
    category: "Mechanical",
    healthKey: "mechanical",
    specs: "Forged counter-weighted crankshaft with 6-bolt prop flange",
    material: "4340 Nickel-Chromium-Moly Billet Steel",
    positionOffset: [0, 0, 1.4]
  },
  {
    id: "box-5",
    number: 5,
    name: "Main Crankcase & Squeeze Bearings",
    category: "Mechanical",
    healthKey: "mechanical",
    specs: "Horizontally split crankcase with tri-metal journal bearings",
    material: "Die-Cast Magnesium Alloy AZ91D",
    positionOffset: [0, 0, 0]
  },
  {
    id: "box-6",
    number: 6,
    name: "High-Pressure Oil Pump & Spin-On Filter",
    category: "Lubrication",
    healthKey: "lubrication",
    specs: "Gerotor high-flow oil pump with integrated bypass pressure valve",
    material: "Machined Billet 6061-T6 Aluminum",
    positionOffset: [-0.4, -0.6, -0.3]
  },
  {
    id: "box-7",
    number: 7,
    name: "Oil Cooler Radiator & Matrix",
    category: "Lubrication",
    healthKey: "lubrication",
    specs: "Full-flow 10-row louvered oil cooler with thermostat valve",
    material: "Vacuum-Brazed Aluminum Matrix",
    positionOffset: [0, -0.8, -0.8]
  },
  {
    id: "box-8",
    number: 8,
    name: "Dual Electronic Fuel Injectors & Throttle",
    category: "Combustion",
    healthKey: "combustion",
    specs: "Multi-hole fuel injector valves with fly-by-wire throttle servo",
    material: "Anodized Aerospace Aluminum",
    positionOffset: [0, 0.6, -0.3]
  }
];

export function getPartsCatalogForModel(modelType: "turbine" | "uav" | "boxer"): PartInfo[] {
  switch (modelType) {
    case "turbine":
      return TURBINE_PARTS_CATALOG;
    case "boxer":
      return BOXER_PARTS_CATALOG;
    case "uav":
    default:
      return UAV_PARTS_CATALOG;
  }
}

export const DEFAULT_MISSION: MissionInfo = {
  id: "MISSION-042",
  aircraft_id: "UAV-HEX-09",
  name: "Sector Delta High-Altitude ISR Sortie",
  duration_planned_hours: 4.5,
  elapsed_hours: 2.3,
  phase: "CRUISE",
  status: "ACTIVE",
  origin: "Airbase FOB North",
  destination: "Sector Delta Waypoint 6"
};
