// Button.tsx
import React, { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
  disabled?: boolean;
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  className = "",
  children,
  prefixIcon,
  suffixIcon,
  disabled = false,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors focus:outline-none";

  const variantClasses = clsx({
    "bg-primary text-white hover:bg-indigo-700 dark:bg-primary dark:hover:bg-indigo-700": variant === "primary" && !disabled,
    "border bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700": variant === "secondary" && !disabled,
    "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700": variant === "danger" && !disabled,
  });

  const disabledClasses =
    "opacity-50 cursor-not-allowed pointer-events-none border text-white";

  return (
    <button
      className={clsx(baseClasses, variantClasses, disabled && disabledClasses, className)}
      disabled={disabled}
      {...props}
    >
      {prefixIcon && <span className="flex items-center">{prefixIcon}</span>}
      {children}
      {suffixIcon && <span className="flex items-center">{suffixIcon}</span>}
    </button>
  );
};

export default Button;
