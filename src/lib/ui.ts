export type ButtonVariant = "primary" | "secondary" | "outline" | "dangerOutline";
export type ButtonSize = "lg" | "sm";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-text",
  secondary: "bg-control text-text",
  outline: "border border-border text-text",
  dangerOutline: "border border-red-900 text-red-400",
};

const sizeClasses: Record<ButtonSize, string> = {
  lg: "h-14 w-full text-lg font-semibold",
  sm: "h-11 px-4 font-medium",
};

export function buttonClass(variant: ButtonVariant, size: ButtonSize = "lg"): string {
  return `flex items-center justify-center gap-2 rounded-2xl disabled:opacity-40 ${sizeClasses[size]} ${variantClasses[variant]}`;
}

export const cardClass = "rounded-2xl bg-card p-5";
