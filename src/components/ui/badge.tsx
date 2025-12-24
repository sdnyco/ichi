"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = {
  default: "bg-zinc-900 text-white",
  secondary: "bg-zinc-100 text-zinc-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-800",
  destructive: "bg-red-100 text-red-700",
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  )
}

