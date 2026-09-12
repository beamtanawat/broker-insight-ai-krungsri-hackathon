"use client";
import React, { useState } from "react";
import type { CandidateCustomerOut, LocationPoint } from "@/types";

interface NearbyMapVisualizerProps {
  brokerLocation: LocationPoint;
  radiusKm: number | null;
  customers: CandidateCustomerOut[];
  selectedCustomerId: string | null;
  onSelectCustomer: (customer: CandidateCustomerOut) => void;
  height?: number | string;
  totalCount?: number;
  navActive?: boolean;
}

export function NearbyMapVisualizer({
  brokerLocation,
  radiusKm = 10,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  height = "100%",
  totalCount = 128,
  navActive = false,
}: NearbyMapVisualizerProps) {
  const [showRadius, setShowRadius] = useState(true);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const [zoomLevel, setZoomLevel] = useState(1);

  // Selected customer
  const selectedCustomer = customers.find((c) => c.customer_id === selectedCustomerId) || customers[0] || null;

  // Visual layout bounds for the SVG canvas (viewBox 0 0 700 700)
  // Center is at (350, 420)
  const CENTER_X = 350;
  const CENTER_Y = 410;

  // Radii in SVG pixels
  const RADIUS_5KM_PX = 130;
  const RADIUS_10KM_PX = 230;

  // Distinct offsets for the 10 showcase pins around the center to match the screenshot
  const PIN_COORDINATES = [
    { id: "c0c0f992-b06d-4b9f-bbc6-9b4458a79491", x: 415, y: 355, score: 94, color: "#EF4444" }, // Natcha (selected)
    { id: "d82e838c-63fb-47a3-9428-f15dc4d68883", x: 375, y: 395, score: 88, color: "#EF4444" }, // Nattaporn
    { id: "c0a451ce-a2b5-406e-9358-4a2af87721ca", x: 355, y: 320, score: 76, color: "#F59E0B" }, // Wipa
    { id: "f535562e-8f70-4711-bbd0-7e092606cdd7", x: 340, y: 440, score: 52, color: "#F59E0B" }, // Thanapoom
    { id: "e1a9b2c3-d4e5-6f7a-8b9c-0d1e2f3a4b5c", x: 460, y: 480, score: 62, color: "#F59E0B" }, // Wipa Rung
    { id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e", x: 375, y: 530, score: 52, color: "#F59E0B" }, // Kamonwan
    { id: "a3b4c5d6-e7f8-9a0b-1c2d-3e4f5a6b7c8d", x: 500, y: 450, score: 55, color: "#10B981" }, // Saran
    { id: "9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d4c", x: 360, y: 485, score: 45, color: "#10B981" }, // Preecha
    { id: "8e7d6c5b-4a3f-2e1d-0c9b-8a7f6e5d4c3b", x: 435, y: 540, score: 45, color: "#10B981" }, // Decha
    { id: "7d6c5b4a-3f2e-1d0c-9b8a-7f6e5d4c3b2a", x: 480, y: 400, score: 55, color: "#10B981" }, // Ekkasit
  ];

  const getPinColor = (score?: number | null) => {
    const s = score ?? 50;
    if (s >= 85) return "#EF4444"; // Red
    if (s >= 60) return "#F59E0B"; // Amber/Orange
    return "#10B981"; // Green
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        display: "flex",
        flexDirection: "column",
        height: typeof height === "number" ? `${height}px` : height,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Map Header Bar */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid #F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          backgroundColor: "#ffffff",
          zIndex: 5,
        }}
      >
        {/* Title + Legend */}
        <div>
          <div
            style={{
              fontSize: "0.9375rem",
              fontWeight: 800,
              color: "#0F172A",
              marginBottom: "4px",
            }}
          >
            ลูกค้าในรัศมี {radiusKm || 10} กม. ({totalCount} ราย)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.75rem", color: "#64748B" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#EF4444" }} />
              ความสำคัญสูง (28)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#F59E0B" }} />
              ปานกลาง (45)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10B981" }} />
              ต่ำ (55)
            </span>
          </div>
        </div>

        {/* Toggle Show Radius Checkbox */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#334155",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={showRadius}
            onChange={(e) => setShowRadius(e.target.checked)}
            style={{ cursor: "pointer", accentColor: "#5a4544" }}
          />
          <span>แสดงรัศมี {radiusKm || 10} กม.</span>
        </label>
      </div>

      {/* Map Body Canvas */}
      <div
        style={{
          position: "relative",
          flex: 1,
          backgroundColor: mapType === "satellite" ? "#1E293B" : "#F3F4F6",
          overflow: "hidden",
          minHeight: "580px",
        }}
      >
        {/* Floating Controls: Upper Left Zoom & Layer */}
        <div
          style={{
            position: "absolute",
            top: "14px",
            left: "14px",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              border: "1px solid #E2E8F0",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.8))}
              style={{
                width: "32px",
                height: "32px",
                border: "none",
                borderBottom: "1px solid #E2E8F0",
                backgroundColor: "#ffffff",
                fontSize: "1rem",
                fontWeight: 700,
                color: "#334155",
                cursor: "pointer",
              }}
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
              style={{
                width: "32px",
                height: "32px",
                border: "none",
                backgroundColor: "#ffffff",
                fontSize: "1rem",
                fontWeight: 700,
                color: "#334155",
                cursor: "pointer",
              }}
            >
              −
            </button>
          </div>

          <button
            type="button"
            title="ชั้นข้อมูล"
            style={{
              width: "32px",
              height: "32px",
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            🛡️
          </button>
        </div>

        {/* Floating Controls: Bottom Right (Satellite & Compass) */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            right: "16px",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {/* Satellite Toggle Button */}
          <button
            type="button"
            onClick={() => setMapType((m) => (m === "standard" ? "satellite" : "standard"))}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              padding: "4px 8px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#334155",
            }}
          >
            <span
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "4px",
                backgroundColor: "#334155",
                display: "inline-block",
                backgroundImage: "radial-gradient(#64748B 20%, transparent 20%)",
                backgroundSize: "6px 6px",
              }}
            />
            <span>ดาวเทียม</span>
          </button>

          {/* Compass Recenter Button */}
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            title="จัดกึ่งกลางตำแหน่งปัจจุบัน"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              border: "1px solid #E2E8F0",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              cursor: "pointer",
              color: "#5a4544",
            }}
          >
            🧭
          </button>
        </div>

        {/* SVG Cartography View */}
        <svg
          viewBox="0 0 700 700"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            transform: `scale(${zoomLevel})`,
            transformOrigin: "center center",
            transition: "transform 0.2s ease",
          }}
        >
          <defs>
            {/* Map Grid Pattern */}
            <pattern id="streetGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <rect width="30" height="30" fill={mapType === "satellite" ? "#0F172A" : "#F8FAFC"} />
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke={mapType === "satellite" ? "#1E293B" : "#E2E8F0"} strokeWidth="0.75" />
            </pattern>

            {/* Drop Shadow for Callout */}
            <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Map Base Background */}
          <rect width="700" height="700" fill="url(#streetGrid)" />

          {/* Cartographic Thai Roads & River Geometries (Stylized Bangkok / Lat Krabang / Suvarnabhumi) */}
          <g opacity={mapType === "satellite" ? "0.35" : "0.85"}>
            {/* Canals & Waterways */}
            <path
              d="M 120 0 Q 180 200, 240 380 T 360 700"
              fill="none"
              stroke="#BAE6FD"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 0 460 Q 250 440, 500 480 T 700 500"
              fill="none"
              stroke="#BAE6FD"
              strokeWidth="8"
            />

            {/* Motorways & Expressways (Highway 7 & Kanchanaphisek Highway 9) */}
            <path
              d="M 50 250 L 680 290"
              fill="none"
              stroke="#FDE047"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M 50 250 L 680 290"
              fill="none"
              stroke="#CA8A04"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M 280 40 L 310 680"
              fill="none"
              stroke="#FDE047"
              strokeWidth="7"
            />
            <path
              d="M 280 40 L 310 680"
              fill="none"
              stroke="#CA8A04"
              strokeWidth="5"
            />

            {/* Main Arterial Avenues (Rama 9, Lat Krabang Rd, Chalong Krung, King Kaew) */}
            <path d="M 100 400 L 650 420" fill="none" stroke="#CBD5E1" strokeWidth="6" />
            <path d="M 150 520 L 600 540" fill="none" stroke="#CBD5E1" strokeWidth="5" />
            <path d="M 450 100 L 470 650" fill="none" stroke="#CBD5E1" strokeWidth="5" />
            <path d="M 180 80 L 210 650" fill="none" stroke="#CBD5E1" strokeWidth="4" />
            <path d="M 560 120 L 590 620" fill="none" stroke="#CBD5E1" strokeWidth="4" />

            {/* Area Geography Labels */}
            <text x="320" y="240" fill="#94A3B8" fontSize="13" fontWeight="700" letterSpacing="3">
              ลาดกระบัง
            </text>
            <text x="480" y="320" fill="#94A3B8" fontSize="11" fontWeight="600">
              สุวรรณภูมิ
            </text>
            <text x="210" y="360" fill="#94A3B8" fontSize="11" fontWeight="600">
              ประเวศ
            </text>
            <text x="320" y="660" fill="#94A3B8" fontSize="12" fontWeight="700">
              BANGKOK
            </text>
          </g>

          {/* Concentric Radius Circles (5 km and 10 km) */}
          {showRadius && (
            <g>
              {/* 5 km Inner Circle */}
              <circle
                cx={CENTER_X}
                cy={CENTER_Y}
                r={RADIUS_5KM_PX}
                fill="rgba(90, 69, 68, 0.04)"
                stroke="#735a59"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {/* 5 km Label Badge */}
              <rect
                x={CENTER_X - 18}
                y={CENTER_Y - RADIUS_5KM_PX - 8}
                width="36"
                height="16"
                rx="4"
                fill="#5a4544"
              />
              <text
                x={CENTER_X}
                y={CENTER_Y - RADIUS_5KM_PX + 3}
                fill="#ffffff"
                fontSize="9"
                fontWeight="700"
                textAnchor="middle"
              >
                5 กม.
              </text>

              {/* 10 km Outer Circle */}
              <circle
                cx={CENTER_X}
                cy={CENTER_Y}
                r={RADIUS_10KM_PX}
                fill="rgba(90, 69, 68, 0.06)"
                stroke="#5a4544"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              {/* 10 km Label Badge */}
              <rect
                x={CENTER_X + RADIUS_10KM_PX - 12}
                y={CENTER_Y - 8}
                width="40"
                height="16"
                rx="4"
                fill="#5a4544"
              />
              <text
                x={CENTER_X + RADIUS_10KM_PX + 8}
                y={CENTER_Y + 4}
                fill="#ffffff"
                fontSize="9"
                fontWeight="700"
                textAnchor="middle"
              >
                10 กม.
              </text>
            </g>
          )}

          {/* Center: Broker Location Beacon */}
          <g transform={`translate(${CENTER_X}, ${CENTER_Y})`}>
            <title>{`ตำแหน่งของคุณ: ${brokerLocation.name || "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าลาดกระบัง"}`}</title>
            {/* Pulse Ring */}
            <circle cx="0" cy="0" r="24" fill="none" stroke="#5a4544" strokeWidth="1.5" opacity="0.4" />
            <circle cx="0" cy="0" r="14" fill="#5a4544" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="5" fill="#ffffff" />

            {/* Label Pill */}
            <rect
              x="-48"
              y="16"
              width="96"
              height="20"
              rx="10"
              fill="#4a3837"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="29"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="9"
              fontWeight="700"
            >
              ตำแหน่งของคุณ
            </text>
          </g>

          {/* Customer Pins & Dynamic Route Visualization */}
          {(() => {
            const selectedIndex = customers.findIndex((c) => c.customer_id === selectedCustomer?.customer_id);
            const targetCoord =
              selectedIndex >= 0 && selectedIndex < PIN_COORDINATES.length
                ? PIN_COORDINATES[selectedIndex]
                : { x: 415, y: 355 };

            return (
              <>
                {/* Route line when navigation is active */}
                {navActive && selectedCustomer && (
                  <g>
                    {/* Route line underlay glow */}
                    <line
                      x1={CENTER_X}
                      y1={CENTER_Y}
                      x2={targetCoord.x}
                      y2={targetCoord.y}
                      stroke="#5a4544"
                      strokeWidth="7"
                      strokeOpacity="0.2"
                      strokeLinecap="round"
                    />
                    {/* Dashed main route line */}
                    <line
                      x1={CENTER_X}
                      y1={CENTER_Y}
                      x2={targetCoord.x}
                      y2={targetCoord.y}
                      stroke="#5a4544"
                      strokeWidth="3.5"
                      strokeDasharray="8 5"
                      strokeLinecap="round"
                    />
                    {/* Midpoint distance pill */}
                    <g transform={`translate(${(CENTER_X + targetCoord.x) / 2}, ${(CENTER_Y + targetCoord.y) / 2})`}>
                      <rect
                        x="-32"
                        y="-11"
                        width="64"
                        height="22"
                        rx="11"
                        fill="#4a3837"
                        stroke="#ffffff"
                        strokeWidth="2"
                        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}
                      />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9.5"
                        fontWeight="800"
                      >
                        {selectedCustomer.distance_km || 2.1} กม.
                      </text>
                    </g>
                  </g>
                )}

                {/* Customer Pins with Score Numbers */}
                {customers.slice(0, 10).map((c, i) => {
                  const coord = PIN_COORDINATES[i] || { x: CENTER_X + 60, y: CENTER_Y - 40 };
                  const isSelected = selectedCustomer?.customer_id === c.customer_id;
                  const score = c.priority_score ?? 50;
                  const pinColor = getPinColor(score);

                  return (
                    <g
                      key={c.customer_id}
                      transform={`translate(${coord.x}, ${coord.y})`}
                      onClick={() => onSelectCustomer(c)}
                      style={{
                        cursor: "pointer",
                        opacity: navActive && !isSelected ? 0.35 : 1,
                        transition: "opacity 0.2s ease, transform 0.2s ease",
                      }}
                    >
                      {/* Active Highlight Ring */}
                      {isSelected && (
                        <circle
                          cx="0"
                          cy="0"
                          r="22"
                          fill="none"
                          stroke={navActive ? "#5a4544" : "#EF4444"}
                          strokeWidth="2.5"
                          strokeDasharray="4 3"
                          opacity="0.9"
                        />
                      )}

                      {/* Pin Circle */}
                      <circle
                        cx="0"
                        cy="0"
                        r={isSelected ? "17" : "14"}
                        fill={pinColor}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" }}
                      />

                      {/* Score Number inside Pin */}
                      <text
                        x="0"
                        y={isSelected ? "5" : "4"}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={isSelected ? "11" : "9.5"}
                        fontWeight="800"
                      >
                        {score}
                      </text>
                    </g>
                  );
                })}

                {/* Callout Popup over Selected Customer */}
                {selectedCustomer && (
                  <g
                    transform={`translate(${targetCoord.x}, ${targetCoord.y - 48})`}
                    filter="url(#cardShadow)"
                    onClick={() => onSelectCustomer(selectedCustomer)}
                    style={{ cursor: "pointer", transition: "transform 0.25s ease" }}
                  >
                    {/* White Speech Bubble Card */}
                    <rect
                      x="-105"
                      y="-32"
                      width="210"
                      height="46"
                      rx="8"
                      fill="#ffffff"
                      stroke={navActive ? "#5a4544" : "#E2E8F0"}
                      strokeWidth={navActive ? "2" : "1"}
                    />
                    {/* Downward Pointer Triangle */}
                    <polygon points="-6,14 6,14 0,22" fill="#ffffff" stroke={navActive ? "#5a4544" : "#E2E8F0"} strokeWidth="1" />
                    <polygon points="-5,14 5,14 0,21" fill="#ffffff" />

                    {/* Customer Name */}
                    <text
                      x="0"
                      y="-13"
                      textAnchor="middle"
                      fill="#0F172A"
                      fontSize="11.5"
                      fontWeight="800"
                    >
                      {selectedCustomer.customer_name} {navActive ? "🚀" : ""}
                    </text>

                    {/* Subtitle: Score & Distance */}
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="#64748B"
                      fontSize="9.5"
                      fontWeight="600"
                    >
                      {navActive ? (
                        <tspan fill="#5a4544" fontWeight="800">กำลังนำทาง</tspan>
                      ) : (
                        <>คะแนน <tspan fill="#DC2626" fontWeight="800">{selectedCustomer.priority_score || 94}</tspan></>
                      )} • {selectedCustomer.distance_km || 2.1} กม.
                    </text>
                  </g>
                )}
              </>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
