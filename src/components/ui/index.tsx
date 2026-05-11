"use client";
import React from "react";
import { Loader2 } from "lucide-react";
import { classNames } from "@/lib/utils";

// ─── Button ─────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}


// ─── Badge ───────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
}

export function Badge({
  children,
  variant = "default",
  size = "sm",
}: BadgeProps) {
  const variants = {
    default: {
      background: "var(--bg-3)",
      color: "var(--text-muted)",
      border: "1px solid var(--border)",
    },
    success: {
      background: "var(--green-bg)",
      color: "var(--green)",
      border: "1px solid rgba(52,211,153,0.2)",
    },
    warning: {
      background: "var(--yellow-bg)",
      color: "var(--yellow)",
      border: "1px solid rgba(251,191,36,0.2)",
    },
    danger: {
      background: "var(--red-bg)",
      color: "var(--red)",
      border: "1px solid rgba(248,113,113,0.2)",
    },
    info: {
      background: "var(--blue-bg)",
      color: "var(--blue)",
      border: "1px solid rgba(96,165,250,0.2)",
    },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: size === "sm" ? "2px 8px" : "4px 12px",
        borderRadius: 100,
        fontSize: size === "sm" ? 11 : 12,
        fontWeight: 600,
        letterSpacing: "0.03em",
        ...variants[variant],
      }}
    >
      {children}
    </span>
  );
}

// ─── Spinner ─────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <Loader2
      size={size}
      className="animate-spin"
      style={{ color: "var(--accent)" }}
    />
  );
}

// ─── Avatar ──────────────────────────────────────────────
export function Avatar({
  name,
  size = 36,
  src,
}: {
  name: string;
  size?: number;
  src?: string;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const colors = [
    "#6c63ff",
    "#845ef7",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#ef4444",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: src ? "transparent" : color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 700,
        color: "white",
        fontFamily: "'Syne', sans-serif",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: number;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 480,
}: ModalProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="animate-fade-in"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          width: "100%",
          maxWidth: width,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "var(--shadow)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3 style={{ fontSize: 17, fontWeight: 600 }}>{title}</h3>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                fontSize: 20,
                lineHeight: 1,
                padding: "0 4px",
              }}
            >
              ×
            </button>
          </div>
        )}
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        textAlign: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "var(--bg-3)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-dim)",
          fontSize: 32,
        }}
      >
        {icon}
      </div>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
          {title}
        </h3>
        {description && (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── Dropdown ────────────────────────────────────────────
interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface DropdownMenuProps {
  items: DropdownItem[];
  onClose: () => void;
  style?: React.CSSProperties;
}

export function DropdownMenu({ items, onClose, style }: DropdownMenuProps) {
  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 49 }}
        onClick={onClose}
      />
      <div
        className="animate-fade-in"
        style={{
          position: "absolute",
          zIndex: 50,
          minWidth: 180,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: 6,
          boxShadow: "var(--shadow)",
          ...style,
        }}
      >
        {items.map((item, i) =>
          item.divider ? (
            <div
              key={i}
              style={{
                height: 1,
                background: "var(--border)",
                margin: "4px 0",
              }}
            />
          ) : (
            <button
              key={i}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  onClose();
                }
              }}
              disabled={item.disabled}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                background: "none",
                border: "none",
                cursor: item.disabled ? "not-allowed" : "pointer",
                color: item.danger ? "var(--red)" : "var(--text)",
                fontSize: 13,
                borderRadius: 6,
                textAlign: "left",
                opacity: item.disabled ? 0.5 : 1,
                fontFamily: "'DM Sans', sans-serif",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!item.disabled)
                  (e.target as HTMLElement).style.background = "var(--bg-3)";
              }}
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.background = "none")
              }
            >
              {item.icon && (
                <span
                  style={{
                    color: item.danger ? "var(--red)" : "var(--text-muted)",
                  }}
                >
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ),
        )}
      </div>
    </>
  );
}

// ─── Search Input ─────────────────────────────────────────
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <span
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-muted)",
          display: "flex",
        }}
      >
        🔍
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search..."}
        style={{
          background: "var(--bg-3)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: "9px 14px 9px 38px",
          color: "var(--text)",
          fontSize: 14,
          outline: "none",
          width: "100%",
          fontFamily: "'DM Sans', sans-serif",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
      />
    </div>
  );
}
