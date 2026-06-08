import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
};

const styles = {
  primary: "btn-primary",
  secondary: "bg-[var(--dark)] text-white hover:bg-[var(--primary)]",
  ghost: "bg-transparent text-[var(--muted)] hover:bg-[#f1f3f5]",
  outline: "btn-outline",
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
