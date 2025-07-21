import { ButtonHTMLAttributes, FC } from "react";
import { twMerge } from "tailwind-merge";

export const Button: FC<ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className,
  children,
  ...props
}) => (
  <button
    className={twMerge(
      "px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </button>
);