import type { Config } from 'tailwindcss'

const config: Config = {
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