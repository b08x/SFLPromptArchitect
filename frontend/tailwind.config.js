/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Main application background
        'app-bg': '#212934',
        
        // Secondary surfaces (cards, modals, panels, input fields, chat bubbles)
        'surface': '#333e48',
        
        // Borders, dividers, inactive UI elements
        'border-gray': '#5c6f7e',
        
        // Key text and interactive elements
        'accent': '#e2a32d',
        
        // Primary buttons and user-generated content
        'primary-action': '#c36e26',
        
        // Secondary text elements
        'text-secondary': '#95aac0',
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}