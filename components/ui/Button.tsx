import { type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?:    "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

const variants = {
  primary:   "bg-hfc-lime text-hfc-black hover:bg-white active:scale-[0.97] font-bold",
  secondary: "bg-hfc-orange text-white hover:bg-[#FF8A50] active:scale-[0.97] font-bold",
  outline:   "border border-hfc-border text-white hover:border-hfc-lime/50 hover:bg-hfc-card active:scale-[0.97]",
  ghost:     "text-hfc-muted hover:text-white transition-colors",
  danger:    "bg-hfc-red/10 border border-hfc-red/30 text-hfc-red hover:bg-hfc-red/20 active:scale-[0.97]",
};

const sizes = {
  sm: "px-4 py-2.5 text-sm rounded-xl",
  md: "px-5 py-3.5 text-sm rounded-2xl",
  lg: "px-6 py-4 text-base rounded-2xl",
};

export default function Button({
  children,
  variant   = "primary",
  size      = "md",
  loading   = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-display transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin flex-shrink-0" />}
      {children}
    </button>
  );
}
