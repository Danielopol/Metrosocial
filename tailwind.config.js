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
    },
  },
  plugins: [],
} 