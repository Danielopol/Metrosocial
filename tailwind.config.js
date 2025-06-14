/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6", // Blue
        secondary: "#F3F4F6", // Light Gray
        accent: "#10B981", // Green
        warning: "#FBBF24", // Amber
        error: "#EF4444", // Red
        "text-primary": "#1F2937", // Dark Gray
        "text-secondary": "#6B7280", // Medium Gray
      },
      scale: {
        '120': '1.2',
      },
      borderWidth: {
        '3': '3px',
      },
      width: {
        '15': '3.75rem',
      },
      height: {
        '15': '3.75rem',
      },
      animation: {
        'proximity-pulse': 'proximity-pulse 4s infinite',
      },
      keyframes: {
        'proximity-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.02)', opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
} 