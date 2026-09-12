"use client";
import React, { useState, useMemo } from "react";
import type { RouteStopOut, LocationPoint } from "@/types";

interface RouteMapVisualizerProps {
  stops: RouteStopOut[];
  startLocation?: LocationPoint | null;
  selectedStopIndex?: number | null;
  onSelectStop?: (stopIndex: number) => void;
  height?: number | string;
}

export function RouteMapVisualizer({
  stops,
  selectedStopIndex = null,
  onSelectStop,
  height = 480,
}: RouteMapVisualizerProps) {
  const [hoveredStop, setHoveredStop] = useState<RouteStopOut | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Map canvas bounds in SVG coordinates
  const SVG_WIDTH = 800;
  const SVG_HEIGHT = 560;
  const PADDING = 70;

  // Filter valid coordinates
  const validPoints = useMemo(() => {
    const pts: { lat: number; lng: number; stop: RouteStopOut }[] = [];
    for (const s of stops) {
      if (typeof s.latitude === "number" && typeof s.longitude === "number") {
        pts.push({ lat: s.latitude, lng: s.longitude, stop: s });
      }
    }
    return pts;
  }, [stops]);

  // Compute bounding box for projection
  const bounds = useMemo(() => {
    if (validPoints.length === 0) {
      // Default to central Bangkok bounds (Sathorn / Rama 3 / Sukhumvit)
      return {
        minLat: 13.66,
        maxLat: 13.78,
        minLng: 100.50,
        maxLng: 100.60,
      };
    }

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const p of validPoints) {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    }

    // Ensure minimum span to prevent divide-by-zero or extreme zoom
    const latSpan = Math.max(maxLat - minLat, 0.04);
    const lngSpan = Math.max(maxLng - minLng, 0.04);

    return {
      minLat: minLat - latSpan * 0.15,
      maxLat: maxLat + latSpan * 0.15,
      minLng: minLng - lngSpan * 0.15,
      maxLng: maxLng + lngSpan * 0.15,
    };
  }, [validPoints]);

  // Coordinate projection from GPS (lat, lng) to SVG (x, y)
  // Latitude maps to Y (inverted: higher latitude = smaller Y)
  // Longitude maps to X (higher longitude = larger X)
  const project = React.useCallback(
    (lat: number, lng: number) => {
      const xPct = (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng);
      const yPct = 1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat);

      const x = PADDING + xPct * (SVG_WIDTH - 2 * PADDING);
      const y = PADDING + yPct * (SVG_HEIGHT - 2 * PADDING);
      return { x, y };
    },
    [bounds]
  );

  // Projected stops with SVG x, y
  const projectedStops = useMemo(() => {
    return stops.map((stop) => {
      const pt = project(stop.latitude, stop.longitude);
      return {
        ...stop,
        svgX: pt.x,
        svgY: pt.y,
      };
    });
  }, [stops, project]);

  // Build SVG path string connecting stops in sequence
  const routePathD = useMemo(() => {
    if (projectedStops.length < 2) return "";
    let d = `M ${projectedStops[0].svgX} ${projectedStops[0].svgY}`;
    for (let i = 1; i < projectedStops.length; i++) {
      const prev = projectedStops[i - 1];
      const curr = projectedStops[i];
      // Subtle smooth curve via mid-control point
      const midX = (prev.svgX + curr.svgX) / 2;
      const midY = (prev.svgY + curr.svgY) / 2;
      d += ` Q ${midX} ${midY} ${curr.svgX} ${curr.svgY}`;
    }
    return d;
  }, [projectedStops]);

  // Midpoints for travel segment distance/time badges
  const segmentMidpoints = useMemo(() => {
    const midpoints: { x: number; y: number; distKm: number; timeMins: number; label: string }[] = [];
    for (let i = 1; i < projectedStops.length; i++) {
      const prev = projectedStops[i - 1];
      const curr = projectedStops[i];
      if (curr.distance_from_prev_km > 0) {
        midpoints.push({
          x: (prev.svgX + curr.svgX) / 2,
          y: (prev.svgY + curr.svgY) / 2,
          distKm: curr.distance_from_prev_km,
          timeMins: curr.travel_time_from_prev_minutes,
          label: `${curr.travel_time_from_prev_minutes.toFixed(0)} น. • ${curr.distance_from_prev_km.toFixed(1)} กม.`,
        });
      }
    }
    return midpoints;
  }, [projectedStops]);

  // Handle Zoom controls
  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.75));
  const handleReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        backgroundColor: "#f1f5f9",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Zoom / Map Controls */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          right: "14px",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(4px)",
          padding: "6px",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-md)",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <button
          onClick={handleZoomIn}
          title="ขยายแผนที่ (Zoom In)"
          style={{
            width: "32px",
            height: "32px",
            border: "none",
            backgroundColor: "white",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--krungsri-navy)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          title="ย่อแผนที่ (Zoom Out)"
          style={{
            width: "32px",
            height: "32px",
            border: "none",
            backgroundColor: "white",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--krungsri-navy)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          −
        </button>
        <button
          onClick={handleReset}
          title="รีเซ็ตมุมมอง (Reset View)"
          style={{
            width: "32px",
            height: "32px",
            border: "none",
            backgroundColor: "white",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--krungsri-navy)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          ⟲
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div
        style={{
          position: "absolute",
          bottom: "14px",
          left: "14px",
          zIndex: 10,
          backgroundColor: "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(6px)",
          padding: "8px 12px",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-sm)",
          border: "1px solid rgba(0,0,0,0.08)",
          fontSize: "0.75rem",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "var(--krungsri-yellow)",
              border: "2px solid var(--krungsri-navy)",
              display: "inline-block",
            }}
          />
          <span style={{ fontWeight: 600, color: "var(--krungsri-navy)" }}>สำนักงานกรุงศรี (จุดเริ่มต้น/กลับ)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#ef4444",
              display: "inline-block",
            }}
          />
          <span style={{ color: "var(--slate-700)" }}>ความสำคัญสูง</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#f59e0b",
              display: "inline-block",
            }}
          />
          <span style={{ color: "var(--slate-700)" }}>ความสำคัญปานกลาง</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#10b981",
              display: "inline-block",
            }}
          />
          <span style={{ color: "var(--slate-700)" }}>ความสำคัญทั่วไป</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span
            style={{
              width: "18px",
              height: "3px",
              backgroundColor: "var(--primary-600)",
              display: "inline-block",
              borderRadius: "2px",
            }}
          />
          <span style={{ color: "var(--slate-700)" }}>เส้นทาง AI</span>
        </div>
      </div>

      {/* Main SVG Visualization */}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: "center center",
          transition: "transform 250ms ease-out",
        }}
      >
        <defs>
          {/* Animated gradient for route line */}
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5a4544" />
            <stop offset="50%" stopColor="#fecb00" />
            <stop offset="100%" stopColor="#5a4544" />
          </linearGradient>

          {/* Marker Shadow Filter */}
          <filter id="markerShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
          </filter>

          {/* River Glow Filter */}
          <filter id="riverGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── Background Map Grid / Urban Canvas ── */}
        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#f8fafc" />

        {/* Grid lines for subtle cartographic feel */}
        {Array.from({ length: 9 }).map((_, i) => (
          <line
            key={`grid-x-${i}`}
            x1={(i + 1) * 80}
            y1={0}
            x2={(i + 1) * 80}
            y2={SVG_HEIGHT}
            stroke="#e2e8f0"
            strokeWidth="0.7"
            strokeDasharray="4 6"
          />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={`grid-y-${i}`}
            x1={0}
            y1={(i + 1) * 80}
            x2={SVG_WIDTH}
            y2={(i + 1) * 80}
            stroke="#e2e8f0"
            strokeWidth="0.7"
            strokeDasharray="4 6"
          />
        ))}

        {/* ── Chao Phraya River Schematic Graphic ── */}
        {/* Adds geographic realism for Bangkok metropolitan area */}
        <path
          d="M 180 0 C 220 120, 240 220, 210 320 C 180 410, 260 480, 290 560"
          fill="none"
          stroke="#bfdbfe"
          strokeWidth="32"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M 180 0 C 220 120, 240 220, 210 320 C 180 410, 260 480, 290 560"
          fill="none"
          stroke="#93c5fd"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.7"
        />
        <text x="215" y="160" fill="#60a5fa" fontSize="10" fontWeight="600" opacity="0.6" transform="rotate(75, 215, 160)">
          แม่น้ำเจ้าพระยา (Chao Phraya River)
        </text>

        {/* District Landmark Watermarks */}
        <text x="440" y="240" fill="#94a3b8" fontSize="11" fontWeight="600" opacity="0.4" letterSpacing="1">
          เขตสาทร / SILOM
        </text>
        <text x="460" y="380" fill="#94a3b8" fontSize="11" fontWeight="600" opacity="0.4" letterSpacing="1">
          เขตยานนาวา / RAMA 3
        </text>
        <text x="560" y="180" fill="#94a3b8" fontSize="11" fontWeight="600" opacity="0.4" letterSpacing="1">
          สุขุมวิท / SUKHUMVIT
        </text>
        <text x="320" y="140" fill="#94a3b8" fontSize="11" fontWeight="600" opacity="0.4" letterSpacing="1">
          ปทุมวัน / PLOENCHIT
        </text>

        {/* ── Route Paths ── */}
        {routePathD && (
          <>
            {/* Outer Route Halo */}
            <path
              d={routePathD}
              fill="none"
              stroke="#5a4544"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.25"
            />
            {/* Main Animated Route Line */}
            <path
              d={routePathD}
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="8 4"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="24;0"
                dur="1.2s"
                repeatCount="indefinite"
              />
            </path>
          </>
        )}

        {/* ── Segment Distance/Time Badges ── */}
        {segmentMidpoints.map((mid, idx) => (
          <g key={`seg-${idx}`} transform={`translate(${mid.x}, ${mid.y})`}>
            <rect
              x="-46"
              y="-11"
              width="92"
              height="20"
              rx="10"
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth="1"
              filter="url(#markerShadow)"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill="var(--krungsri-navy)"
              fontSize="9"
              fontWeight="700"
              fontFamily="sans-serif"
            >
              🚗 {mid.label}
            </text>
          </g>
        ))}

        {/* ── Route Stop Markers ── */}
        {projectedStops.map((stop, idx) => {
          const isOffice = stop.stop_type === "office_start" || stop.stop_type === "office_end";
          const isSelected = selectedStopIndex === idx;
          const isHovered = hoveredStop?.stop_order === stop.stop_order;
          const customer = stop.customer;

          // Customer Priority Color
          const pinColor = isOffice
            ? "var(--krungsri-yellow)"
            : customer?.priority_level === "high"
            ? "#dc2626"
            : customer?.priority_level === "medium"
            ? "#d97706"
            : "#16a34a";

          // Calculate visit customer sequence number (1, 2, 3...)
          const customerOrderNumber = isOffice ? null : stop.stop_order;

          return (
            <g
              key={`stop-${idx}-${stop.stop_order}`}
              transform={`translate(${stop.svgX}, ${stop.svgY})`}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoveredStop(stop)}
              onMouseLeave={() => setHoveredStop(null)}
              onClick={() => onSelectStop && onSelectStop(idx)}
            >
              {/* Radar pulse animation for office start/end */}
              {isOffice && (
                <circle r="22" fill="var(--krungsri-yellow)" opacity="0.25">
                  <animate
                    attributeName="r"
                    values="16;28;16"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.35;0.05;0.35"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Selection Ring */}
              {(isSelected || isHovered) && (
                <circle
                  r={isOffice ? "20" : "18"}
                  fill="none"
                  stroke={isOffice ? "var(--krungsri-navy)" : pinColor}
                  strokeWidth="3"
                  strokeDasharray="3 3"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0"
                    to="360"
                    dur="6s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Outer Pin Body */}
              <circle
                r={isOffice ? "15" : "13"}
                fill={pinColor}
                stroke="#ffffff"
                strokeWidth="2.5"
                filter="url(#markerShadow)"
              />

              {/* Pin Inner Content */}
              {isOffice ? (
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="var(--krungsri-navy)"
                  fontSize="11"
                  fontWeight="900"
                >
                  🏢
                </text>
              ) : (
                <text
                  x="0"
                  y="4.5"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="800"
                  fontFamily="sans-serif"
                >
                  {customerOrderNumber}
                </text>
              )}

              {/* Permanent Label beneath marker */}
              <g transform="translate(0, 23)">
                <rect
                  x="-60"
                  y="-8"
                  width="120"
                  height="16"
                  rx="4"
                  fill="rgba(15, 23, 42, 0.78)"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="600"
                >
                  {isOffice
                    ? "สำนักงานพระราม 3"
                    : customer?.customer_name
                    ? customer.customer_name.length > 14
                      ? `${customer.customer_name.slice(0, 13)}…`
                      : customer.customer_name
                    : `จุดแวะ #${stop.stop_order}`}
                </text>
              </g>
            </g>
          );
        })}

        {/* ── Interactive Hover Tooltip Card ── */}
        {hoveredStop && (
          <g transform={`translate(${Math.min(Math.max(hoveredStop.latitude ? project(hoveredStop.latitude, hoveredStop.longitude).x : 100, 120), SVG_WIDTH - 150)}, ${Math.max((hoveredStop.latitude ? project(hoveredStop.latitude, hoveredStop.longitude).y : 100) - 85, 40)})`}>
            <rect
              x="-110"
              y="-42"
              width="230"
              height="80"
              rx="8"
              fill="var(--krungsri-navy)"
              stroke="var(--krungsri-yellow)"
              strokeWidth="1.5"
              filter="url(#markerShadow)"
            />
            {/* Title / Stop Name */}
            <text x="-98" y="-22" fill="var(--krungsri-yellow)" fontSize="12" fontWeight="700">
              {hoveredStop.stop_type === "office_start"
                ? "🏁 จุดเริ่มต้น: สนง. พระราม 3"
                : hoveredStop.stop_type === "office_end"
                ? "🏁 ปลายทาง: สนง. พระราม 3"
                : `📍 จุดแวะที่ ${hoveredStop.stop_order}: ${hoveredStop.customer?.customer_name || hoveredStop.location_name}`}
            </text>
            {/* Details */}
            <text x="-98" y="-4" fill="#ffffff" fontSize="12" fontWeight="500">
              {hoveredStop.address ? hoveredStop.address.slice(0, 30) : "พิกัดกรุงเทพมหานคร"}
            </text>
            <text x="-98" y="14" fill="#94a3b8" fontSize="12">
              {hoveredStop.distance_from_prev_km > 0
                ? `${hoveredStop.travel_time_from_prev_minutes.toFixed(0)} นาที (${hoveredStop.distance_from_prev_km.toFixed(1)} กม.)`
                : "จุดเริ่มออกเดินทาง"}
            </text>
            {hoveredStop.customer?.why_now && (
              <text x="-98" y="30" fill="#fde047" fontSize="12" fontWeight="600">
                ⚡ Why Now: {hoveredStop.customer.why_now.slice(0, 26)}…
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
