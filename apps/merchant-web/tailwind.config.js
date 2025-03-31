/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@loyaltystudio/ui/tailwind.config.js")],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Add any app-specific colors here
      },
    },
  },
  plugins: [],
} 