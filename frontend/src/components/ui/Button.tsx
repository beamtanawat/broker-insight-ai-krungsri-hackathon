import React from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost" | "approve" | "modify" | "reject";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, { bg: string; text: string; border: string; hoverBg: string }> = {
  primary: {
    bg: "var(--primary-700)",
    text: "var(--white)",
    border: "var(--primary-700)",
    hoverBg: "var(--primary-800)",
  },
  secondary: {
    bg: "var(--slate-100)",
    text: "var(--slate-800)",
    border: "var(--slate-200)",
    hoverBg: "var(--slate-200)",
  },
  outline: {
    bg: "var(--white)",
    text: "var(--slate-700)",
    border: "var(--slate-300)",
    hoverBg: "var(--slate-50)",
  },
  danger: {
    bg: "var(--danger-solid)",
    text: "var(--white)",
    border: "var(--danger-solid)",
    hoverBg: "#b91c1c",
  },
  ghost: {
    bg: "transparent",
    text: "var(--slate-600)",
    border: "transparent",
    hoverBg: "var(--slate-100)",
  },
  approve: {
    bg: "#15803d",
    text: "var(--white)",
    border: "#15803d",
    hoverBg: "#166534",
  },
  modify: {
    bg: "#d97706",
    text: "var(--white)",
    border: "#d97706",
    hoverBg: "#b45309",
  },
  reject: {
    bg: "#dc2626",
    text: "var(--white)",
    border: "#dc2626",
    hoverBg: "#b91c1c",
  },
};

const SIZE_STYLES: Record<ButtonSize, { padding: string; fontSize: string; height: string }> = {
  sm: { padding: "0 10px", fontSize: "0.75rem", height: "30px" },
  md: { padding: "0 14px", fontSize: "0.8125rem", height: "36px" },
  lg: { padding: "0 18px", fontSize: "0.875rem", height: "42px" },
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { bg, text, border } = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const { padding, fontSize, height } = SIZE_STYLES[size];

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
        borderRadius: "var(--radius-md)",
        fontWeight: 600,
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        opacity: disabled || isLoading ? 0.6 : 1,
        transition: "var(--transition-fast)",
        padding,
        fontSize,
        height,
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {isLoading ? (
        <span
          style={{
            width: "14px",
            height: "14px",
            border: "2px solid rgba(255,255,255,0.4)",
            borderTopColor: "currentColor",
            borderRadius: "50%",
            display: "inline-block",
            animation: "spin 0.8s linear infinite",
          }}
        />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
