import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type FieldProps<T extends ElementType> = {
  as?: T;
  label: string;
  hint?: string;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "className" | "children">;

/** Zuup-styled input/textarea/select. Warm cream on black. */
export function Field<T extends ElementType = "input">({
  as,
  label,
  hint,
  className,
  children,
  ...rest
}: FieldProps<T>) {
  const Comp = (as || "input") as ElementType;
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.2em] text-ink-dim mb-2">
        {label}
      </span>
      <Comp
        className={cn(
          "w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-ink text-[15px] placeholder:text-ink-dim/60",
          "focus:outline-none focus:border-lime/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-lime/10",
          "transition-all",
          className,
        )}
        {...rest}
      >
        {children}
      </Comp>
      {hint && <span className="block text-xs text-ink-dim mt-2">{hint}</span>}
    </label>
  );
}

export function SubmitBtn({
  children,
  loading,
  ...rest
}: ComponentPropsWithoutRef<"button"> & { loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className={cn(
        "group h-14 px-8 rounded-full bg-lime text-black text-[15px] font-semibold",
        "flex items-center justify-center gap-2 transition-all",
        "hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
        "shadow-[0_10px_40px_-8px_rgba(223,255,62,0.35)]",
      )}
    >
      {loading ? "…" : children}
      {!loading && <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>}
    </button>
  );
}
