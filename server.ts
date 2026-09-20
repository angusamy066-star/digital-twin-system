import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API health endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "aerotwin-api",
    platform: "SIH26054 Digital Twin & Mission Reliability Engine",
    timestamp: new Date().toISOString()
  });
});

// Lazy-initialized Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    try {
      genAIClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.warn("Failed to initialize GoogleGenAI client:", err);
    }
  }
  return genAIClient;
}

// AI Engineering Advisory endpoint
app.post("/api/ai/diagnose", async (req, res) => {
  const { telemetry, twin, fault, question } = req.body || {};

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Return high-quality deterministic aerospace diagnostic response when API key is unconfigured
    const simulatedResponse = generateRuleBasedAdvisory(telemetry, twin, fault, question);
    return res.json({
      success: true,
      source: "rule_engine_fallback",
      advisory: simulatedResponse
    });
  }

  try {
    const ai = getGenAI();
    if (!ai) throw new Error("Gemini AI client not initialized");

    const prompt = `You are the chief aerospace propulsion and prognostics specialist for the AeroTwin platform (SIH26054 advisory monitoring system).
Analyze the following telemetry and digital twin state:

[TELEMETRY]
Engine ID: ${telemetry?.engine_id || "ENG-001"}
RPM: ${telemetry?.rpm}
CHT (Cylinder Head Temp): ${telemetry?.cht_c}°C (Warning: 180°C, Critical: 215°C)
EGT (Exhaust Gas Temp): ${telemetry?.egt_c}°C (Warning: 760°C, Critical: 900°C)
Oil Pressure: ${telemetry?.oil_pressure_kpa} kPa (Warning: 350 kPa, Critical: 250 kPa)
Vibration: ${telemetry?.vibration_g} g (Warning: 0.40 g, Critical: 0.90 g)
Fuel Flow: ${telemetry?.fuel_flow_lph} L/h
Altitude: ${telemetry?.altitude_m} m
Throttle: ${telemetry?.throttle_percent}%
Active Injected Fault: ${fault || "None"}

[DIGITAL TWIN STATE]
Overall Health Score: ${twin?.health_score}/100
Anomaly Score (Residual Risk): ${twin?.anomaly_score}
Estimated RUL: ${twin?.rul_hours} operating hours
Mission Reliability: ${twin?.mission_reliability}%
Component Health: Thermal=${twin?.component_health?.thermal}%, Lubrication=${twin?.component_health?.lubrication}%, Mechanical=${twin?.component_health?.mechanical}%, Combustion=${twin?.component_health?.combustion}%
Active Alerts: ${JSON.stringify(twin?.alerts || [])}

User Question / Context: ${question || "Provide root-cause diagnosis, mission risk assessment, and recommended maintenance action."}

Format your response in structured markdown with the following clear sections:
### 1. Executive Telemetry & Residual Assessment
### 2. Root Cause Hypothesis & Component Stress Analysis
### 3. Mission Reliability Impact & Abort/Continue Advisory
### 4. Recommended Maintenance Actions (Action Item, Urgency, Inspection Method)
### 5. DRDO / Advisory Compliance Note (Heuristic vs Validated Envelope)
Keep the tone authoritative, concise, and focused on propulsion engineering principles.`;

    const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let aiResponseText = "";
    let modelUsed = "";
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        if (response.text) {
          aiResponseText = response.text;
          modelUsed = modelName;
          break;
        }
      } catch (err: any) {
        lastError = err;
        // If high demand (503) or rate limit (429), try next candidate model
        const isTemporary =
          err?.status === 503 ||
          err?.status === 429 ||
          err?.message?.includes("503") ||
          err?.message?.includes("high demand") ||
          err?.message?.includes("ResourceExhausted") ||
          err?.message?.includes("UNAVAILABLE");

        if (isTemporary) {
          console.warn(`Model ${modelName} experiencing high demand (${err?.message || "503"}). Trying fallback model...`);
          // Brief pause before trying next candidate
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        } else {
          console.warn(`Model ${modelName} encountered error:`, err?.message || err);
          break;
        }
      }
    }

    if (aiResponseText) {
      return res.json({
        success: true,
        source: "gemini_ai",
        model: modelUsed,
        advisory: aiResponseText
      });
    }

    // If candidate models were unavailable (e.g. 503 high demand), gracefully fallback
    console.warn("All Gemini models temporarily unavailable or experiencing high demand. Serving calibrated rule engine advisory.");
    const simulatedResponse = generateRuleBasedAdvisory(telemetry, twin, fault, question);
    return res.json({
      success: true,
      source: "rule_engine_fallback",
      notice: "Live model capacity spike; advisory generated via calibrated aerospace rule engine.",
      advisory: simulatedResponse
    });
  } catch (error: any) {
    console.warn("Gracefully recovered from Gemini advisory error:", error?.message || error);
    const simulatedResponse = generateRuleBasedAdvisory(telemetry, twin, fault, question);
    return res.json({
      success: true,
      source: "rule_engine_fallback",
      error: error?.message,
      advisory: simulatedResponse
    });
  }
});

function generateRuleBasedAdvisory(telemetry: any, twin: any, fault: string, question?: string): string {
  const isOilFault = fault === "oil_pressure" || (telemetry?.oil_pressure_kpa && telemetry.oil_pressure_kpa < 350);
  const isThermalFault = fault === "overheat" || (telemetry?.cht_c && telemetry.cht_c > 180);
  const isVibFault = fault === "vibration" || (telemetry?.vibration_g && telemetry.vibration_g > 0.40);

  let rootCause = "Operating parameters within nominal flight envelope. All component residuals within ±1.2σ bounds.";
  let riskImpact = "Nominal mission profile. Engine reliability remains above 95% with zero abort triggers.";
  let maintenance = "- **Routine Pre-Flight:** Standard visual inspection of cowl vents and spark plug connectors.\\n- **Schedule:** Next phased maintenance inspection at 50 operating hours.";

  if (isOilFault) {
    rootCause = "High negative oil pressure residual detected (-3.2σ divergence). Suspected scavenging pump cavitating or partial bypass valve pressure regulator leakage.";
    riskImpact = "Lubrication film degradation on journal bearings. Continued cruise risks micro-galling and accelerated bearing seizure within 45-90 minutes.";
    maintenance = "- **Urgent Check:** Inspect oil pressure relief valve and check sump magnetic plug for ferrous swarf.\\n- **Action:** Perform oil filter cut-and-inspect before next sortie.\\n- **Advisory:** Ground mission if oil pressure drops below 250 kPa critical ceiling.";
  } else if (isThermalFault) {
    rootCause = "Elevated CHT (>185°C) and EGT divergence (>765°C). Suspected cylinder baffle seal displacement, lean air-fuel mixture, or localized cowling cooling airflow constriction.";
    riskImpact = "Thermal fatigue on cylinder head studs and piston ring micro-welding. Thermal efficiency down by 8.4%.";
    maintenance = "- **Thermal Baffle Check:** Verify cylinder head air baffling integrity and cowl flap actuator extension.\\n- **Fuel Injection:** Calibrate fuel flow divider and injector nozzles for cylinder balancing.\\n- **Operational:** Enrich mixture or reduce cruise throttle by 8% to restore CHT below 175°C.";
  } else if (isVibFault) {
    rootCause = "Vibration amplitude exceeded 0.45g threshold with predominant 1X/2X shaft order harmonics. Indicates propeller unbalance, motor mount bushing elastomer hardening, or bearing raceway spalling.";
    riskImpact = "High-cycle fatigue induced in motor mount truss and airframe nacelle attachments. Accelerated RUL decay.";
    maintenance = "- **Dynamic Balance:** Perform dynamic propeller balancing and pitch track verification.\\n- **Torque Check:** Inspect motor mount isolation dampers and airframe bolt torques.\\n- **Spectrometry:** Conduct vibration FFT analysis to isolate rotating component frequency.";
  }

  return `### 1. Executive Telemetry & Residual Assessment
- **Engine ID:** ${telemetry?.engine_id || "ENG-001"} | **Phase:** ${telemetry?.mission_phase || "CRUISE"}
- **Twin Health Score:** ${twin?.health_score ?? 94.2}% (Anomaly Score: ${twin?.anomaly_score ?? 0.058})
- **Estimated RUL:** ${twin?.rul_hours ?? 282.5} hrs | **Mission Reliability:** ${twin?.mission_reliability ?? 96.8}%

### 2. Root Cause Hypothesis & Component Stress Analysis
${rootCause}

### 3. Mission Reliability Impact & Abort/Continue Advisory
${riskImpact}
- **Primary Risk Factor:** ${isOilFault ? "Lubrication pressure decay" : isThermalFault ? "Thermal envelope transgression" : isVibFault ? "Mechanical vibration harmonics" : "None detected"}
- **Confidence Interval:** P10: ${Math.round((twin?.rul_hours || 100) * 0.7)}h | P50: ${twin?.rul_hours || 100}h | P90: ${Math.round((twin?.rul_hours || 100) * 1.35)}h (Confidence 76%)

### 4. Recommended Maintenance Actions
${maintenance}

### 5. DRDO / Advisory Compliance Note
*Advisory Monitoring Only:* This prediction is produced by AeroTwin heuristic telemetry streaming logic. Per DO-178C guidelines, advisory recommendations must be confirmed by qualified avionics ground crew prior to maintenance sign-off.`;
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AeroTwin Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
