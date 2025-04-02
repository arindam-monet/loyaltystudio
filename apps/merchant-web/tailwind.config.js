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
        sidebar: {
          DEFAULT: "hsl(var(--bg-sidebar))",
          foreground: "hsl(var(--text-sidebar))",
          hover: "hsl(var(--bg-sidebar-hover))",
          text: "hsl(var(--text-sidebar))",
        },
      },
    },
  },
  plugins: [],
} 