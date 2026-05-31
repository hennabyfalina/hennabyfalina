import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#ffffff',
        foreground: '#111111',
        // Admin theme colors (will be overridden by CSS variables)
        admin: {
          bg: {
            primary: 'var(--admin-bg-primary)',
            card: 'var(--admin-bg-card)',
            elevated: 'var(--admin-bg-elevated)',
            hover: 'var(--admin-bg-hover)',
          },
          text: {
            primary: 'var(--admin-text-primary)',
            secondary: 'var(--admin-text-secondary)',
            muted: 'var(--admin-text-muted)',
            accent: 'var(--admin-accent)',
          },
          border: 'var(--admin-border)',
          accent: 'var(--admin-accent-solid)',
          warning: 'var(--admin-warning)',
          danger: 'var(--admin-danger)',
          success: 'var(--admin-success)',
        },
      },
      spacing: {
        // Clean spacing scale
      },
      boxShadow: {
        // No shadows by default - minimal design
        DEFAULT: 'none',
      },
    },
  },
  plugins: [],
}
export default config