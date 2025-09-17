// Button.tsx
import React, { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  className = "",
  children,
  prefixIcon,
  suffixIcon,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors focus:outline-none";

  const variantClasses = clsx({
    "bg-primary text-white hover:bg-indigo-700": variant === "primary",
    "border bg-white text-gray-700 hover:bg-gray-50": variant === "secondary",
    "bg-red-600 text-white hover:bg-red-700": variant === "danger",
  });

  return (
    <button className={clsx(baseClasses, variantClasses, className)} {...props}>
      {prefixIcon && <span className="flex items-center">{prefixIcon}</span>}
      {children}
      {suffixIcon && <span className="flex items-center">{suffixIcon}</span>}
    </button>
  );
};

export default Button;
