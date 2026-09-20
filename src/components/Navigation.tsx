import React from "react";
import {
  LayoutDashboard,
  Layers,
  LineChart,
  ShieldCheck,
  History,
  Sliders,
  AlertTriangle
} from "lucide-react";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  alertCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  alertCount
}) => {
  const tabs = [
    { id: "dashboard", label: "Operator Dashboard", icon: LayoutDashboard },
    { id: "twin", label: "3D Digital Twin", icon: Layers, badge: "CAD Studio" },
    { id: "live", label: "Live Telemetry Monitor", icon: LineChart },
    { id: "prognostics", label: "ML Prognostics & RUL", icon: ShieldCheck },
    { id: "replay", label: "Mission Replay & Ingestion", icon: History },
    { id: "settings", label: "Engine Profile & Limits", icon: Sliders }
  ];

  return (
    <nav className="bg-white border-b border-slate-200 px-4 lg:px-6">
      <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-2 text-xs">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                isActive
                  ? "bg-slate-100 text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
              <span>{t.label}</span>
              {t.badge && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  {t.badge}
                </span>
              )}
              {t.id === "dashboard" && alertCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-white">
                  {alertCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
