import { InputHTMLAttributes, FC } from "react";
import { twMerge } from "tailwind-merge";

export const Input: FC<InputHTMLAttributes<HTMLInputElement>> = ({
  className,
  ...props
}) => (
  <input
    className={twMerge(
      "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
      className
    )}
    {...props}
  />
);