export const siteConfig = {
  name: 'Agency Foundation',
  description: 'Agency project template with standardized structure',
  url: 'https://example.com',
  ogImage: 'https://example.com/og.jpg',
  links: {
    twitter: 'https://twitter.com',
    github: 'https://github.com',
  },
  nav: [
    {
      title: 'Dashboard',
      href: '/dashboard',
    },
    {
      title: 'Items',
      href: '/dashboard/items',
    },
    {
      title: 'Settings',
      href: '/dashboard/settings',
    },
  ],
}

export type SiteConfig = typeof siteConfig
