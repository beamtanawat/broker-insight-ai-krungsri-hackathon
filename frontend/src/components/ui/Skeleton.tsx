import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  width = "100%",
  height = "16px",
  borderRadius = "var(--radius-sm)",
  className = "",
  style,
}: SkeletonProps) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "var(--slate-200)",
        ...style,
      }}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}>
      <Skeleton height="32px" borderRadius="var(--radius-md)" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: "12px" }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} height="24px" width={`${100 / cols}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}
