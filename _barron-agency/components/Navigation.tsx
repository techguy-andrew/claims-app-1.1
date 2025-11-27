'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Inline utility for merging Tailwind classes - makes component portable
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function Navigation() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home' },
    { href: '/demo', label: 'Demo' },
    { href: '/items', label: 'Items' },
    { href: '/properties', label: 'Properties' },
    { href: '/settings', label: 'Settings' },
  ]

  return (
    <nav className="flex gap-4">
      {links.map((link) => {
        const isActive = pathname === link.href

        return (
          <Link
            key={link.href}
            href={link.href}
            prefetch={true}
            className={cn(
              'text-sm transition-colors hover:underline',
              isActive
                ? 'font-semibold text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
