/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/api/views/**/*.hbs',
    './apps/api/src/**/*.{js,ts}',
    './apps/api/public/**/*.html',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0A2540', // Deep blue for primary actions
        'primary-hover': '#0d2f52',
        secondary: '#00C49A', // Vibrant teal for accents
        'secondary-hover': '#00ad88',
        'background-light': '#F8F9FA', // Light gray background
        'background-dark': '#101922', // Dark background
        'text-light': '#495057', // Darker gray for body text
        'text-dark': '#E0E0E0', // Light text for dark mode
        'text-headings': '#2C3E50', // Dark slate gray for headings
        'text-headings-dark': '#FFFFFF', // White for dark mode headings
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          '"Fira Sans"',
          '"Droid Sans"',
          '"Helvetica Neue"',
          'sans-serif',
        ],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        card: '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        112: '28rem',
        128: '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
