"use client";

import React, {
  forwardRef,
  InputHTMLAttributes,
} from "react";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  loading?: boolean;
}

/* =========================
   INPUT
========================= */

const Input = forwardRef<
  HTMLInputElement,
  InputProps
>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = "",
      inputClassName = "",
      required = false,
      disabled = false,
      loading = false,
      id,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        className={`
          w-full
          space-y-2
          ${className}
        `}
      >
        {/* =========================
            LABEL
        ========================= */}

        {label && (
          <label
            htmlFor={id}
            className="
              flex items-center gap-1.5

              text-sm
              font-semibold

              text-gray-700
              dark:text-gray-300
            "
          >
            {label}

            {required && (
              <span className="text-red-500">
                *
              </span>
            )}
          </label>
        )}

        {/* =========================
            INPUT WRAPPER
        ========================= */}

        <div className="relative group">
          {/* Glow Effect */}

          <div
            className={`
              pointer-events-none
              absolute inset-0

              rounded-2xl

              opacity-0
              blur-xl

              transition-all duration-300

              ${
                error
                  ? "bg-red-500/10 group-focus-within:opacity-100"
                  : "bg-orange-500/10 group-focus-within:opacity-100"
              }
            `}
          />

          {/* =========================
              LEFT ICON
          ========================= */}

          {leftIcon && (
            <div
              className={`
                absolute left-4 top-1/2
                -translate-y-1/2

                z-20

                flex items-center justify-center

                pointer-events-none

                transition-all duration-200

                ${
                  error
                    ? "text-red-500"
                    : `
                      text-gray-500
                      dark:text-gray-300

                      group-focus-within:text-orange-500
                      dark:group-focus-within:text-orange-400
                    `
                }
              `}
            >
              {leftIcon}
            </div>
          )}

          {/* =========================
              INPUT
          ========================= */}

          <input
            ref={ref}
            id={id}
            disabled={disabled || loading}
            className={`
              relative
              w-full

              rounded-2xl
              border

              bg-white
              dark:bg-zinc-900

              text-gray-900
              dark:text-white

              placeholder:text-gray-400
              dark:placeholder:text-gray-500

              shadow-sm

              transition-all duration-200

              focus:outline-none
              focus:ring-4

              disabled:cursor-not-allowed
              disabled:opacity-60

              ${
                leftIcon
                  ? "pl-11"
                  : "pl-4"
              }

              ${
                rightIcon || loading
                  ? "pr-11"
                  : "pr-4"
              }

              py-3

              ${
                error
                  ? `
                    border-red-500
                    focus:border-red-500
                    focus:ring-red-500/20
                  `
                  : `
                    border-gray-200
                    dark:border-zinc-700

                    hover:border-orange-300
                    dark:hover:border-orange-700

                    focus:border-orange-500
                    focus:ring-orange-500/20
                  `
              }

              ${inputClassName}
            `}
            {...props}
          />

          {/* =========================
              RIGHT ICON / LOADER
          ========================= */}

          {(rightIcon || loading) && (
            <div
              className={`
                absolute right-4 top-1/2
                -translate-y-1/2

                z-20

                flex items-center justify-center

                transition-all duration-200

                ${
                  error
                    ? "text-red-500"
                    : `
                      text-gray-500
                      dark:text-gray-300

                      group-focus-within:text-orange-500
                      dark:group-focus-within:text-orange-400
                    `
                }
              `}
            >
              {loading ? (
                <div
                  className="
                    h-4 w-4
                    animate-spin
                    rounded-full
                    border-2
                    border-orange-500
                    border-t-transparent
                  "
                />
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>

        {/* =========================
            ERROR
        ========================= */}

        {error && (
          <p
            className="
              text-sm
              font-medium
              text-red-500
              animate-fade-in
            "
          >
            {error}
          </p>
        )}

        {/* =========================
            HELPER TEXT
        ========================= */}

        {!error && helperText && (
          <p
            className="
              text-sm
              text-gray-500
              dark:text-gray-400
            "
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;