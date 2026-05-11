'use client';

import React from 'react';

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  padding?: boolean;
  glow?: boolean;
}

/* =========================
   MAIN CARD
========================= */

const Card = ({
  children,
  className = '',
  hover = false,
  glass = false,
  padding = false,
  glow = false,
  ...props
}: CardProps) => {
  return (
    <div
      {...props}
      className={`
        group
        relative overflow-hidden
        rounded-3xl
        border
        transition-all duration-300 ease-out

        ${
          glass
            ? `
              bg-white/70
              backdrop-blur-2xl
              border-white/20

              dark:bg-zinc-900/60
              dark:border-white/10
            `
            : `
              bg-white/95
              border-gray-200/80

              dark:bg-zinc-900/95
              dark:border-zinc-800
            `
        }

        ${
          hover
            ? `
              hover:-translate-y-1.5
              hover:shadow-2xl
              hover:shadow-orange-500/10
              hover:border-orange-300/70

              dark:hover:border-orange-700/60
            `
            : ''
        }

        ${
          glow
            ? `
              before:absolute
              before:inset-0
              before:bg-gradient-to-br
              before:from-orange-500/5
              before:via-transparent
              before:to-transparent
              before:pointer-events-none
            `
            : ''
        }

        ${
          padding ? 'p-6' : ''
        }

        shadow-sm shadow-black/[0.03]
        dark:shadow-black/20

        ${className}
      `}
    >
      {/* subtle top glow */}
      <div
        className="
          pointer-events-none
          absolute inset-x-0 top-0 h-px
          bg-gradient-to-r
          from-transparent
          via-white/60
          to-transparent
          dark:via-white/10
        "
      />

      {children}
    </div>
  );
};

/* =========================
   HEADER
========================= */

export const CardHeader = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`
        flex items-center justify-between
        px-6 py-5

        border-b border-gray-100
        dark:border-zinc-800

        ${className}
      `}
    >
      {children}
    </div>
  );
};

/* =========================
   TITLE
========================= */

export const CardTitle = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h3
      className={`
        text-lg font-semibold tracking-tight
        text-gray-900
        dark:text-white

        ${className}
      `}
    >
      {children}
    </h3>
  );
};

/* =========================
   DESCRIPTION
========================= */

export const CardDescription = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p
      className={`
        mt-1 text-sm leading-relaxed
        text-gray-500
        dark:text-gray-400

        ${className}
      `}
    >
      {children}
    </p>
  );
};

/* =========================
   BODY
========================= */

export const CardBody = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`
        px-6 py-5

        ${className}
      `}
    >
      {children}
    </div>
  );
};

/* =========================
   FOOTER
========================= */

export const CardFooter = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`
        flex items-center justify-between
        gap-3

        px-6 py-4

        border-t border-gray-100
        dark:border-zinc-800

        bg-gray-50/70
        dark:bg-zinc-900/50

        backdrop-blur-sm

        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;