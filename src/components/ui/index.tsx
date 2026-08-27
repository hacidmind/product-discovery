"use client";

import { useEffect, useRef, useState, useCallback, createContext, useContext } from "react";

interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
  autoFocus?: boolean;
}

// Auto-resizing textarea
export function Textarea({
  value,
  onChange,
  placeholder = "",
  className = "",
  minRows = 3,
  autoFocus = false,
}: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus();
    }
  }, [autoFocus]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={minRows}
      className={`
        w-full resize-none rounded-[var(--radius)] border bg-[var(--bg)] px-3 py-2 text-sm
        text-[var(--text)] placeholder:text-[var(--text-tertiary)]
        border-[var(--border)] focus:border-[var(--accent)] focus:outline-none
        transition-colors ${className}
      `}
    />
  );
}

// Badge/Tag component
export function Badge({
  children,
  variant = "default",
  onClick,
}: {
  children: React.ReactNode;
  variant?: "default" | "accent" | "danger" | "success" | "warning";
  onClick?: () => void;
}) {
  const colors: Record<string, string> = {
    default: "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
    accent: "bg-[var(--accent-light)] text-[var(--accent)]",
    danger: "bg-red-50 dark:bg-red-900/20 text-[var(--danger)]",
    success: "bg-green-50 dark:bg-green-900/20 text-[var(--success)]",
    warning: "bg-yellow-50 dark:bg-yellow-900/20 text-[var(--warning)]",
  };

  return (
    <span
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
        ${colors[variant]}
        ${onClick ? "cursor-pointer hover:opacity-80" : ""}
      `}
    >
      {children}
    </span>
  );
}

// Priority indicator
export function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    critical: { label: "Critical", variant: "danger" },
    high: { label: "High", variant: "warning" },
    medium: { label: "Medium", variant: "accent" },
    low: { label: "Low", variant: "default" },
    must: { label: "Must have", variant: "danger" },
    should: { label: "Should have", variant: "warning" },
    could: { label: "Could have", variant: "accent" },
    wont: { label: "Won't have", variant: "default" },
  };

  const c = config[priority] || { label: priority, variant: "default" as const };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

type BadgeProps = Parameters<typeof Badge>[0];

// Card wrapper
export function Card({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)]
        p-4 transition-shadow hover:shadow-sm
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Button
export function Button({
  children,
  variant = "primary",
  size = "sm",
  onClick,
  disabled = false,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "xs" | "sm" | "md";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const base = "inline-flex items-center gap-2 font-medium rounded-[var(--radius)] transition-colors focus-visible:outline-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes: Record<string, string> = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
  };

  const variants: Record<string, string> = {
    primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
    secondary: "bg-[var(--bg-tertiary)] text-[var(--text)] hover:bg-[var(--border)]",
    ghost: "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]",
    danger: "bg-[var(--danger)] text-white hover:bg-red-700",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// Text input with label + error
export function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  error,
  autoFocus = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className={`
          w-full rounded-[var(--radius)] border bg-[var(--bg)] px-3 py-2.5 text-sm
          text-[var(--text)] placeholder:text-[var(--text-tertiary)] transition-colors focus:outline-none
          ${error ? "border-[var(--danger)] focus:border-[var(--danger)]" : "border-[var(--border)] focus:border-[var(--accent)]"}
        `}
      />
      {error && <span className="mt-1.5 block text-xs text-[var(--danger)]">{error}</span>}
    </label>
  );
}

// Loading spinner
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      className="animate-spin text-[var(--text-tertiary)]"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Empty state
export function EmptyState({
  icon = "??",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fadein">
      <div className="text-3xl mb-3 opacity-30">{icon}</div>
      <h3 className="text-sm font-medium text-[var(--text-secondary)]">{title}</h3>
      <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Modal
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 animate-fadein"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg)] mx-4 shadow-xl animate-fadein">
        <div className="flex shrink-0 items-center justify-between px-5 py-4 border-b">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// Select dropdown
export function Select({
  value,
  onChange,
  options,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`
        rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)]
        px-3 py-1.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none
        ${className}
      `}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

// Score slider
export function ScoreSlider({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--text-secondary)] w-28 sm:w-36 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 h-1.5 bg-[var(--bg-tertiary)] rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)]
          [&::-webkit-slider-thumb]:cursor-pointer"
        aria-label={label}
      />
      <span className="text-xs font-mono text-[var(--text)] w-6 text-right">{value}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Toast Notification System
// ═══════════════════════════════════════════════════════════════════════

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  addToast: () => { },
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`
              px-4 py-2.5 rounded-[var(--radius)] text-sm shadow-lg border animate-fadein flex items-center gap-2
              ${toast.type === "success" ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200" : ""}
              ${toast.type === "error" ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200" : ""}
              ${toast.type === "info" ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200" : ""}
            `}
          >
            <span className="text-sm">
              {toast.type === "success" ? "\u2713" : toast.type === "error" ? "\u2717" : "\u2139"}
            </span>
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-current opacity-50 hover:opacity-100"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Confirm Dialog
// ═══════════════════════════════════════════════════════════════════════

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  variant = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
}) {
  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 animate-fadein"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="alertdialog"
      aria-modal="true"
    >
      <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg w-full max-w-sm mx-4 shadow-xl animate-fadein p-6">
        <h3 className="text-sm font-semibold mb-2">{title}</h3>
        <p className="text-xs text-[var(--text-secondary)] mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant={variant} size="sm" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
