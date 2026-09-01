import React, { createContext, useContext } from "react";

type TableDensity = "comfortable" | "compact";
const DensityCtx = createContext<TableDensity>("comfortable");

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  striped?: boolean;
  hoverable?: boolean;
  /** comfortable = default padding; compact = tighter rows for operational views */
  density?: TableDensity;
}

export function Table({
  striped = false,
  hoverable = true,
  density = "comfortable",
  children,
  style,
  className = "",
  ...rest
}: TableProps) {
  return (
    <DensityCtx.Provider value={density}>
      <div style={{ width: "100%", overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: density === "compact" ? "var(--fs-sm)" : "var(--fs-base)",
            textAlign: "left",
            ...style,
          }}
          className={className}
          {...rest}
        >
          {children}
        </table>
      </div>
    </DensityCtx.Provider>
  );
}

export function TableHeader({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <thead
      style={{
        backgroundColor: "var(--slate-50)",
        borderBottom: "1px solid var(--border-subtle)",
        color: "var(--slate-600)",
        fontSize: "var(--fs-xs)",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        ...style,
      }}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({
  children,
  onClick,
  style,
  hover = true,
  selected = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  hover?: boolean;
  selected?: boolean;
}) {
  return (
    <tr
      onClick={onClick}
      aria-selected={selected || undefined}
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        cursor: onClick ? "pointer" : "default",
        backgroundColor: selected ? "var(--primary-50)" : "transparent",
        transition: "background-color var(--motion-fast)",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hover && !selected) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--slate-50)";
      }}
      onMouseLeave={(e) => {
        if (hover && !selected) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
      }}
    >
      {children}
    </tr>
  );
}

export function TableHeadCell({
  children,
  style,
  align = "left",
  sortDirection,
  onSort,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  align?: "left" | "center" | "right";
  /** "asc" | "desc" | undefined — shows sort indicator */
  sortDirection?: "asc" | "desc";
  onSort?: () => void;
}) {
  const density = useContext(DensityCtx);
  const padding = density === "compact" ? "var(--space-2) var(--space-3)" : "var(--space-3) var(--space-4)";

  return (
    <th
      style={{
        padding,
        fontWeight: 700,
        textAlign: align,
        cursor: onSort ? "pointer" : "default",
        userSelect: onSort ? "none" : undefined,
        whiteSpace: "nowrap",
        ...style,
      }}
      onClick={onSort}
      aria-sort={sortDirection === "asc" ? "ascending" : sortDirection === "desc" ? "descending" : undefined}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
        {children}
        {sortDirection && (
          <span aria-hidden="true" style={{ fontSize: "10px", color: "var(--primary-600)" }}>
            {sortDirection === "asc" ? "▲" : "▼"}
          </span>
        )}
      </span>
    </th>
  );
}

export function TableCell({
  children,
  style,
  align = "left",
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  align?: "left" | "center" | "right";
}) {
  const density = useContext(DensityCtx);
  const padding = density === "compact" ? "var(--space-2) var(--space-3)" : "var(--space-3) var(--space-4)";

  return (
    <td
      style={{
        padding,
        color: "var(--slate-800)",
        textAlign: align,
        verticalAlign: "middle",
        ...style,
      }}
    >
      {children}
    </td>
  );
}
