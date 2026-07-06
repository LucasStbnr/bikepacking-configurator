import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md";
};

const variants = {
  primary:
    "bg-ink text-background hover:bg-ink/85 border border-transparent",
  outline:
    "border border-line-strong bg-surface text-ink hover:border-ink/40 hover:bg-surface-raised",
  ghost: "text-ink-secondary hover:bg-line/50 hover:text-ink border border-transparent",
  danger:
    "border border-transparent text-danger hover:bg-danger/8 hover:border-danger/30",
} as const;

const sizes = {
  sm: "h-7 px-2.5 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
} as const;

export function Button({
  variant = "outline",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-md font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
