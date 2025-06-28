
import type { Config } from "tailwindcss";

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { 
          DEFAULT: '#8399A2', 
          light: '#EEF2F3',
          dark: '#8399A2'
        },
        glass: 'rgba(255,255,255,0.08)',
        border: 'rgba(255,255,255,0.2)'
      },
      borderRadius: { lgx: '20px' },
      boxShadow: { glass: '0 4px 32px rgba(0,0,0,0.45)' },
      backdropBlur: { xl: '24px' },
      transitionTimingFunction: { swift: 'cubic-bezier(0.25,0.8,0.25,1)' },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, hsla(197, 14%, 57%, 1) 0%, hsla(192, 17%, 94%, 1) 100%)',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
