'use client'

import { usePathname } from 'next/navigation'
import { HomeIcon } from '@/_barron-agency/icons/HomeIcon'
import { FileTextIcon } from '@/_barron-agency/icons/FileTextIcon'

export interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  description?: string
}

export const NAVIGATION: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: HomeIcon,
    description: 'Dashboard overview and analytics',
  },
  {
    href: '/claims',
    label: 'Claims',
    icon: FileTextIcon,
    description: 'Manage insurance claims',
  },
] as const

export const BRAND = {
  name: 'Seamless Restoration',
  href: '/',
  description: 'Streamlined claims management',
} as const

export function useNavigation() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return { NAVIGATION, BRAND, isActive, pathname }
}
