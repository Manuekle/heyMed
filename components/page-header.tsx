'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Upload01Icon,
  Clock01Icon,
  ArrowLeft01Icon,
  UserCircleIcon
} from '@hugeicons/core-free-icons'
import { BlurFade } from './ui/blur-fade'

interface PageHeaderProps {
  label?: string
  title: string
  description?: string
  showNav?: boolean
  backLink?: string
  backLabel?: string
  avatarUrl?: string | null
  username?: string
  score?: number
}

export function PageHeader({
  label,
  title,
  description,
  showNav = true,
  backLink,
  backLabel = 'inicio',
  avatarUrl,
  username,
  score
}: PageHeaderProps) {
  return (
    <BlurFade delay={0.1}>
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12 mb-12 md:mb-20">
        <div className="space-y-2 md:space-y-4">
          <h1 className="text-heading2 md:text-heading1 text-foreground font-semibold tracking-[-0.04em]">
            {title}
          </h1>
          {description && (
            <p className="text-foreground/40 leading-relaxed max-w-2xl text-text3 md:text-text2 font-semibold tracking-[-0.04em]">
              {description}
            </p>
          )}
        </div>

        <div className="flex flex-col items-start md:items-end gap-4 md:gap-6">
          {/* Right side: Either Nav or Back button */}
          {backLink ? (
            <Link
              href={backLink}
              className="text-text4 tracking-[-0.04em] font-semibold text-foreground/40 hover:text-foreground transition-all duration-500  group flex items-center gap-2"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={14}
                className="group-hover:-translate-x-1 transition-transform"
              />
              <span suppressHydrationWarning>{backLabel}</span>
            </Link>
          ) : showNav && (
            <div className="flex flex-wrap items-center gap-4 md:gap-8 pt-2">
              <Link href="/upload" className="flex items-center gap-2 text-text4 tracking-[-0.04em] font-semibold text-foreground/40 hover:text-foreground transition-all duration-500 ">
                <HugeiconsIcon icon={Upload01Icon} size={14} />
                <span suppressHydrationWarning>subir</span>
              </Link>
              <Link href="/history" className="flex items-center gap-2 text-text4 tracking-[-0.04em] font-semibold text-foreground/40 hover:text-foreground transition-all duration-500 ">
                <HugeiconsIcon icon={Clock01Icon} size={14} />
                <span suppressHydrationWarning>registros</span>
              </Link>
              <Link href="/settings" className="flex items-center gap-2 text-text4 tracking-[-0.04em] font-semibold text-foreground/40 hover:text-foreground transition-all duration-500 ">
                <HugeiconsIcon icon={UserCircleIcon} size={14} />
                <span suppressHydrationWarning>ajustes</span>
              </Link>
            </div>
          )}
        </div>
      </header>
    </BlurFade>
  )
}
