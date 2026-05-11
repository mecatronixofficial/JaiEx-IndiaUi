"use client";

import React from "react";
import { Loader2 } from "lucide-react";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  onClick,
  type = "button",
  ...props
}) => {
  /* =========================
     BASE
  ========================= */

  const baseStyles = `
    relative inline-flex items-center justify-center
    gap-2 shrink-0

    rounded-2xl
    font-semibold

    transition-all duration-300 ease-out

    disabled:pointer-events-none
    disabled:opacity-50

    active:scale-[0.97]

    whitespace-nowrap
    select-none

    overflow-hidden

    outline-none
    focus:outline-none
    focus:ring-0
    focus-visible:ring-0

    before:absolute
    before:inset-0
    before:rounded-[inherit]

    before:opacity-0
    before:transition-opacity
    before:duration-300

    hover:before:opacity-100
  `;

  /* =========================
     VARIANTS
  ========================= */

  const variants = {
    primary: `
      bg-gradient-to-br
      from-orange-500
      via-orange-500
      to-amber-500

      text-white

      shadow-lg
      shadow-orange-500/20

      hover:-translate-y-[2px]
      hover:shadow-2xl
      hover:shadow-orange-500/30

      before:bg-white/10
    `,

    secondary: `
      border border-gray-200/80
      bg-white/80
      backdrop-blur-xl

      text-gray-700

      shadow-sm

      hover:-translate-y-[1px]
      hover:border-orange-300
      hover:bg-orange-50/80
      hover:text-orange-600
      hover:shadow-lg
      hover:shadow-orange-500/10

      dark:border-zinc-700
      dark:bg-zinc-900/80
      dark:text-gray-200

      dark:hover:border-orange-500/40
      dark:hover:bg-orange-500/10
      dark:hover:text-orange-400

      before:bg-orange-500/5
    `,

    ghost: `
      bg-transparent

      text-gray-600

      hover:bg-orange-50
      hover:text-orange-600

      dark:text-gray-300
      dark:hover:bg-orange-500/10
      dark:hover:text-orange-400

      before:bg-orange-500/5
    `,

    danger: `
      bg-gradient-to-br
      from-red-500
      via-red-500
      to-rose-500

      text-white

      shadow-lg
      shadow-red-500/20

      hover:-translate-y-[2px]
      hover:shadow-2xl
      hover:shadow-red-500/30

      before:bg-white/10
    `,

    icon: `
      border border-gray-200
      bg-white/90
      backdrop-blur-xl

      text-gray-600

      shadow-sm

      hover:-translate-y-[1px]
      hover:border-orange-300
      hover:bg-orange-50
      hover:text-orange-500
      hover:shadow-lg
      hover:shadow-orange-500/10

      dark:border-zinc-700
      dark:bg-zinc-900/90
      dark:text-gray-300

      dark:hover:border-orange-500/40
      dark:hover:bg-orange-500/10
      dark:hover:text-orange-400

      before:bg-orange-500/5
    `,
  };

  /* =========================
     SIZES
  ========================= */

  const sizes = {
    sm: `
      h-9
      px-4

      text-sm
    `,

    md: `
      h-11
      px-5

      text-sm
    `,

    lg: `
      h-12
      px-6

      text-base
    `,

    icon: `
      h-10
      w-10
      p-0
    `,
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {/* Shine Effect */}

      <span
        className="
          absolute inset-0

          opacity-0
          transition-opacity duration-300

          bg-gradient-to-r
          from-transparent
          via-white/20
          to-transparent

          translate-x-[-100%]
          hover:translate-x-[100%]
          hover:opacity-100

          duration-700
        "
      />

      {/* Content */}

      <span
        className="
          relative z-10

          flex items-center justify-center
          gap-2

          leading-none
        "
      >
        {/* LEFT ICON */}

        {loading ? (
          <Loader2
            className="
              h-4 w-4
              animate-spin
              shrink-0
            "
          />
        ) : (
          leftIcon && (
            <span
              className="
                flex items-center justify-center
                shrink-0
              "
            >
              {leftIcon}
            </span>
          )
        )}

        {/* TEXT */}

        {children && (
          <span
            className="
              flex items-center
              leading-none
            "
          >
            {children}
          </span>
        )}

        {/* RIGHT ICON */}

        {!loading && rightIcon && (
          <span
            className="
              flex items-center justify-center
              shrink-0
            "
          >
            {rightIcon}
          </span>
        )}
      </span>
    </button>
  );
};

export default Button;