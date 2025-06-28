
import type { Config } from "tailwindcss";

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#ff7a00', light: '#ffa84d' },
        glass: 'rgba(255,255,255,0.08)',
        border: 'rgba(255,255,255,0.2)'
      },
      borderRadius: { lgx: '20px' },
      boxShadow: { glass: '0 4px 32px rgba(0,0,0,0.45)' },
      backdropBlur: { xl: '24px' },
      transitionTimingFunction: { swift: 'cubic-bezier(0.25,0.8,0.25,1)' }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
