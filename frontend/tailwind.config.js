/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Enhanced Dark Theme Color System
        // ===================================
        
        // Background Colors
        'app-bg': '#1a1f2e',           // Darker primary background for better contrast
        'surface': '#242938',          // Enhanced surface color for cards/modals
        'surface-hover': '#2a3041',    // Hover state for interactive surfaces
        'surface-elevated': '#2f364a', // Elevated surfaces (dropdowns, tooltips)
        
        // Border & Divider Colors
        'border-primary': '#3d4458',   // Primary borders with improved contrast
        'border-secondary': '#515873', // Secondary borders for subtle divisions
        'border-interactive': '#6b7491', // Interactive element borders
        
        // Text Colors (WCAG AA Compliant)
        'text-primary': '#e8eaed',     // Primary text - high contrast (14.2:1)
        'text-secondary': '#a8b3c5',   // Secondary text - good contrast (7.8:1)
        'text-tertiary': '#8692a6',    // Tertiary text - adequate contrast (4.9:1)
        'text-disabled': '#5a6578',    // Disabled text state
        
        // Accent & Interactive Colors
        'accent-primary': '#f2b547',   // Enhanced primary accent with better contrast
        'accent-secondary': '#e09725', // Secondary accent for hover states
        'accent-tertiary': '#cc8519',  // Tertiary accent for active states
        
        // Action Colors
        'primary-action': '#d18d2e',   // Primary buttons with improved visibility
        'primary-hover': '#e09e42',    // Primary button hover state
        'primary-active': '#b87a1f',   // Primary button active state
        
        // Secondary Action Colors
        'secondary-action': '#3d4458', // Secondary buttons matching border
        'secondary-hover': '#495066',  // Secondary button hover
        'secondary-active': '#313749', // Secondary button active
        
        // Status Colors (Accessible)
        'success': '#4ade80',          // Success green (7.2:1 contrast)
        'success-bg': '#0f2518',       // Success background
        'warning': '#fbbf24',          // Warning amber (8.1:1 contrast)
        'warning-bg': '#2d1b00',       // Warning background
        'error': '#f87171',            // Error red (6.8:1 contrast)
        'error-bg': '#2d1414',         // Error background
        'info': '#60a5fa',             // Info blue (6.5:1 contrast)
        'info-bg': '#0f1729',          // Info background
        
        // Focus & Selection States
        'focus-ring': '#f2b547',       // Focus ring color matching accent
        'selection-bg': '#2a3041',     // Text selection background
        'selection-text': '#e8eaed',   // Text selection text color
        
        // Legacy color mappings for backward compatibility
        'border-gray': '#3d4458',      // Maps to border-primary
        'accent': '#f2b547',           // Maps to accent-primary
        'text-secondary': '#a8b3c5',   // Updated for better contrast
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