'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Home01Icon,
  Clock01Icon,
  UserCircleIcon,
  Add01Icon
} from '@hugeicons/core-free-icons'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'inicio', icon: Home01Icon },
  { href: '/history', label: 'registros', icon: Clock01Icon },
  { href: '/settings', label: 'ajustes', icon: UserCircleIcon },
]

export function BottomNav() {
  const pathname = usePathname()

  // Hide on practice pages to focus on the case
  if (pathname.startsWith('/practice')) return null

  // Only show on mobile (hidden on md and up)
  return (
    <div 
      className="md:hidden fixed bottom-4 left-0 right-0 z-50 px-6 flex items-center justify-center gap-4"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Main Nav Pill */}
      <nav className="flex items-center gap-1 p-1.5 rounded-full border border-white/[0.05] shadow-2xl backdrop-blur-3xl bg-white/[0.03]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-500 group"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavActive"
                  className="absolute inset-0 bg-foreground rounded-full -z-10"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
                />
              )}
              <HugeiconsIcon
                icon={item.icon}
                size={18}
                className={`transition-all duration-500 ${isActive ? 'text-background' : 'text-foreground/20 group-hover:text-foreground/40'}`}
              />
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[12px] font-semibold text-background tracking-[-0.04em] lowercase"
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* FAB (+) */}
      <Link
        href="/upload"
        className="w-14 h-14 rounded-full bg-foreground flex items-center justify-center text-background shadow-2xl shadow-foreground/20 hover:scale-[1.05] active:scale-[0.95] transition-all duration-300 group"
      >
        <HugeiconsIcon 
          icon={Add01Icon} 
          size={24} 
          className="group-hover:rotate-90 transition-transform duration-500" 
        />
      </Link>
    </div>
  )
}
