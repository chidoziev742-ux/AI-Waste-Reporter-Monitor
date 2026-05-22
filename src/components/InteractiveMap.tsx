import React, { useState } from "react";
import { Report } from "../types";
import { MapPin, AlertTriangle, CheckCircle, ShieldAlert, Droplets, Info, Compass, HelpCircle } from "lucide-react";

interface InteractiveMapProps {
  reports: Report[];
  selectedReport: Report | null;
  onSelectReport: (report: Report | null) => void;
  onSelectCoordinates: (lat: number, lng: number) => void;
  currentCityFilter: string;
}

export default function InteractiveMap({
  reports,
  selectedReport,
  onSelectReport,
  onSelectCoordinates,
  currentCityFilter
}: InteractiveMapProps) {
  const [clickCoords, setClickCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Handle clicking on the interactive map projection grid
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert click coordinates to 0-100 grid positioning
    const lat = Math.round((y / rect.height) * 100);
    const lng = Math.round((x / rect.width) * 100);
    
    setClickCoords({ lat, lng });
    onSelectCoordinates(lat, lng);
  };

  // Status-based bullet styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Critical":
        return "bg-rose-500/25 border border-rose-500 text-rose-300";
      case "Investigating":
        return "bg-amber-500/25 border border-amber-500 text-amber-300";
      case "Clearing":
        return "bg-sky-500/25 border border-sky-500 text-sky-300";
      case "Resolved":
        return "bg-emerald-500/25 border border-emerald-500 text-emerald-300";
      default:
        return "bg-slate-800 border border-slate-700 text-slate-300";
    }
  };

  // Filter reports displayed on actual coordinate view
  const mapFilteredReports = reports.filter(
    (r) => currentCityFilter === "All Cities" || r.city.toLowerCase() === currentCityFilter.toLowerCase()
  );

  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full min-h-[460px]">
      {/* Map Controls Header */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
        <div>
          <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400 animate-spin-slow" />
            Vulnerable Drainage & Hotspot Map
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Click on the urban grid to lock coordinate indicators for a new ecosystem hazard report
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700 cursor-pointer hover:bg-slate-700/80 transition-all select-none">
            <input
              type="checkbox"
              className="rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500/50"
              checked={showHeatmap}
              onChange={(e) => setShowHeatmap(e.target.checked)}
            />
            Overlay Flood Risk Heatmap
          </label>
        </div>
      </div>

      <div className="flex-grow relative bg-slate-950 p-2 overflow-hidden flex items-center justify-center min-h-[350px]">
        {/* SVG Grid Map Visual Engine */}
        <svg
          id="environmental-projection-grid"
          className="w-full h-full max-w-full aspect-[4/3] rounded-xl relative select-none cursor-crosshair overflow-hidden border border-slate-800 bg-slate-950/90"
          onClick={handleMapClick}
        >
          {/* Neon Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(16, 185, 129, 0.05)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Simulated Hydrological Drainage network (Rivers & Storm Sewers) */}
          <path
            d="M -10,32 Q 30,22 45,52 T 110,72"
            fill="none"
            stroke="rgba(14, 165, 233, 0.15)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M -10,32 Q 30,22 45,52 T 110,72"
            fill="none"
            stroke="rgba(14, 165, 233, 0.35)"
            strokeWidth="2"
            strokeDasharray="4,6"
            strokeLinecap="round"
          />
          
          <path
            d="M 52,-10 C 62,32 42,62 47,112"
            fill="none"
            stroke="rgba(14, 165, 233, 0.12)"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Drainage Labels */}
          <text x="14%" y="26%" fill="rgba(14, 165, 233, 0.45)" className="text-[10px] font-mono font-medium tracking-wide" pointerEvents="none">
            ~ STORM CANAL (Zone-Alpha)
          </text>
          <text x="56%" y="82%" fill="rgba(14, 165, 233, 0.4)" className="text-[10px] font-mono" pointerEvents="none">
            ~ KIBERA WATERSHED CHANNEL
          </text>

          {/* Local Market / Congestion District bounds */}
          <rect x="23%" y="33%" width="24%" height="22%" fill="rgba(244, 63, 94, 0.02)" stroke="rgba(244, 63, 94, 0.2)" strokeWidth="1" strokeDasharray="3,3" rx="6" />
          <text x="25%" y="39%" fill="rgba(244, 63, 94, 0.6)" className="text-[9px] font-mono tracking-wider font-semibold" pointerEvents="none">
            [⚠️ HIGH ACCUMULATION SECTOR]
          </text>

          <rect x="58%" y="13%" width="28%" height="24%" fill="rgba(16, 185, 129, 0.02)" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" rx="6" />
          <text x="60%" y="20%" fill="rgba(16, 185, 129, 0.5)" className="text-[9px] font-mono tracking-wider" pointerEvents="none">
            [♻️ CITIZEN RECYCLING HUB]
          </text>

          {/* Interactive Heatmap Layers */}
          {showHeatmap && (
            <>
              {/* High density around critical points */}
              <circle cx="42%" cy="48%" r="42" fill="url(#heat-rose)" className="opacity-45" />
              <circle cx="30%" cy="35%" r="32" fill="url(#heat-amber)" className="opacity-35" />
              <circle cx="60%" cy="55%" r="35" fill="url(#heat-sky)" className="opacity-40" />

              <defs>
                <radialGradient id="heat-rose">
                  <stop offset="0%" stopColor="rgb(244, 63, 94)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(244, 63, 94)" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heat-amber">
                  <stop offset="0%" stopColor="rgb(245, 158, 11)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="rgb(245, 158, 11)" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heat-sky">
                  <stop offset="0%" stopColor="rgb(14, 165, 233)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(14, 165, 233)" stopOpacity="0" />
                </radialGradient>
              </defs>
            </>
          )}

          {/* User Click Indicator */}
          {clickCoords && (
            <g>
              <circle cx={`${clickCoords.lng}%`} cy={`${clickCoords.lat}%`} r="12" className="fill-emerald-400/10 stroke-emerald-400 stroke-1 animate-ping" />
              <line x1={`${clickCoords.lng}%`} y1="0" x2={`${clickCoords.lng}%`} y2="100%" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" strokeDasharray="2,4" />
              <line x1="0" y1={`${clickCoords.lat}%`} x2="100%" y2={`${clickCoords.lat}%`} stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" strokeDasharray="2,4" />
              <circle cx={`${clickCoords.lng}%`} cy={`${clickCoords.lat}%`} r="4" className="fill-emerald-400 stroke-slate-900 stroke-2" />
            </g>
          )}

          {/* Active Hotspot Pins */}
          {mapFilteredReports.map((report) => {
            const isSelected = selectedReport?.id === report.id;
            const size = isSelected ? 30 : 22;
            const xOffset = isSelected ? -15 : -11;
            const yOffset = isSelected ? -30 : -22;

            return (
              <g
                key={report.id}
                className="transition-all duration-300 transform cursor-pointer origin-bottom"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectReport(isSelected ? null : report);
                }}
              >
                {/* Ping rings for critical blockages */}
                {report.status === "Critical" && (
                  <circle
                    cx={`${report.lng}%`}
                    cy={`${report.lat}%`}
                    r={isSelected ? "22" : "14"}
                    className="fill-none stroke-rose-500/40 stroke-1 animate-pulse"
                  />
                )}

                {/* Pin Element container */}
                <foreignObject
                  x={`${report.lng}%`}
                  y={`${report.lat}%`}
                  width={size}
                  height={size}
                  style={{ transform: `translate(${xOffset}px, ${yOffset}px)` }}
                >
                  <div
                    className={`flex items-center justify-center rounded-sm p-1 border border-slate-950/35 shadow-lg ${
                      isSelected ? "scale-110 ring-2 ring-emerald-400" : "hover:scale-105"
                    } ${
                      report.status === "Critical" ? "bg-rose-600 text-white" :
                      report.status === "Investigating" ? "bg-amber-500 text-white" :
                      report.status === "Clearing" ? "bg-sky-500 text-white" : "bg-emerald-500 text-slate-950"
                    }`}
                  >
                    {report.type === "Blocked Drainage" ? (
                      <Droplets className="w-3.5 h-3.5" />
                    ) : report.type === "Illegal Dumping" ? (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* Floating City Location Marker indicator */}
        <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-md text-[10px] font-mono text-emerald-400 px-3 py-1.5 rounded border border-slate-800 flex items-center gap-2 shadow-xl">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>GEOMETRIC MONITOR ACTIVE: {currentCityFilter.toUpperCase()}</span>
        </div>

        {/* Floating clicked guide */}
        {clickCoords && (
          <div className="absolute bottom-4 right-4 bg-slate-900/95 backdrop-blur-md text-slate-100 rounded border border-slate-700 p-3 text-xs shadow-xl max-w-[210px] animate-fade-in">
            <p className="font-bold flex items-center gap-1.5 text-emerald-400 font-display">
              <MapPin className="w-3.5 h-3.5" /> Coordinates Locked
            </p>
            <p className="font-mono text-[10px] text-slate-300 mt-1">
              LAT INDEX: {clickCoords.lat}%<br />
              LNG INDEX: {clickCoords.lng}%
            </p>
            <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">
              Grid lock ready. The coordinates are registered automatically!
            </p>
          </div>
        )}
      </div>

      {/* Selected Marker Detail Card */}
      {selectedReport && (
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-start gap-4 animate-fade-in-up">
          <div className={`p-2 rounded flex-shrink-0 ${getStatusColor(selectedReport.status)}`}>
            {selectedReport.status === "Critical" ? (
              <ShieldAlert className="w-5 h-5" />
            ) : selectedReport.status === "Resolved" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Info className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-400">
                {selectedReport.city} &middot; {selectedReport.type}
              </span>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                selectedReport.status === "Critical" ? "bg-rose-950/80 text-rose-300 border border-rose-800" :
                selectedReport.status === "Resolved" ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800" :
                "bg-amber-950/80 text-amber-300 border border-amber-800"
              }`}>
                {selectedReport.status}
              </span>
              {selectedReport.riskScore >= 80 && (
                <span className="bg-rose-950/80 text-rose-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-rose-800/40 animate-pulse">
                  HIGH FLOOD POTENTIAL
                </span>
              )}
            </div>
            <h3 className="font-bold text-white mt-1 text-sm truncate">{selectedReport.title}</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">{selectedReport.description}</p>
            <p className="text-[10px] text-slate-500 mt-1 font-mono tracking-wide">{selectedReport.location}</p>
          </div>
          <button
            onClick={() => onSelectReport(null)}
            className="text-slate-400 hover:text-white text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800/80 border border-slate-700 transition"
          >
            DISMISS
          </button>
        </div>
      )}
    </div>
  );
}
