"use client"

import React from "react"

import { cn } from "@/lib/utils"

export interface ProgressiveBlurProps {
  className?: string
  height?: string
  width?: string
  position?: "top" | "bottom" | "both" | "left" | "right" | "horizontal"
  blurLevels?: number[]
  children?: React.ReactNode
}

export function ProgressiveBlur({
  className,
  height = "30%",
  width = "30%",
  position = "bottom",
  blurLevels = [0.5, 1, 2, 4, 8, 16, 32, 64],
}: ProgressiveBlurProps) {
  // Create array with length equal to blurLevels.length - 2 (for before/after pseudo elements)
  const divElements = Array(blurLevels.length - 2).fill(null)

  const isVertical = position === "top" || position === "bottom" || position === "both"
  const isHorizontal = position === "left" || position === "right" || position === "horizontal"

  const getMask = () => {
    let direction = "to bottom"
    if (position === "top") direction = "to top"
    if (position === "left") direction = "to left"
    if (position === "right") direction = "to right"

    if (position === "horizontal" || position === "both") {
       const dir = position === "horizontal" ? "right" : "bottom"
       return `linear-gradient(to ${dir}, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)`
    }

    // High-end smooth transition mask
    return `linear-gradient(${direction}, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 15%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0) 100%)`
  }

  return (
    <div
      className={cn(
        "gradient-blur pointer-events-none absolute z-10",
        className,
        position === "top" ? "top-0 inset-x-0" :
          position === "bottom" ? "bottom-0 inset-x-0" :
            position === "left" ? "left-0 inset-y-0" :
              position === "right" ? "right-0 inset-y-0" :
                "inset-0"
      )}
      style={{
        height: (position === "both" || isHorizontal) ? "100%" : height,
        width: (position === "horizontal" || isVertical) ? "100%" : width,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        maskImage: getMask(),
        WebkitMaskImage: getMask(),
      }}
    />
  )
}
