import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant =
  | "primary"
  | "success"
  | "text"
  | "dangerText"
  | "successText";

type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-indigo-600 hover:bg-indigo-500 text-white",
  success: "bg-emerald-700 hover:bg-emerald-600 text-white",
  text: "text-gray-500 hover:text-white",
  dangerText: "text-red-500 hover:text-red-400",
  successText: "text-emerald-500 hover:text-emerald-400",
};

const filledSizeClasses: Record<ButtonSize, string> = {
  xs: "text-xs px-3 py-1.5 rounded-lg",
  sm: "text-sm px-3 py-1.5 rounded-lg",
  md: "text-sm px-4 py-2 rounded-lg",
  lg: "text-sm px-4 py-2.5 rounded-lg",
};

const textSizeClasses: Record<ButtonSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-sm",
  lg: "text-base",
};

const textVariants: ButtonVariant[] = ["text", "dangerText", "successText"];

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const isTextVariant = textVariants.includes(variant);
  const sizeClass = isTextVariant
    ? textSizeClasses[size]
    : filledSizeClasses[size];

  return (
    <button
      type={type}
      className={[
        "font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClass,
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
