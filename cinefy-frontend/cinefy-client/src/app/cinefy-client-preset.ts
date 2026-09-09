import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const CinefyClientPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#fefbe8',
      100: '#fef3c6',
      200: '#fee685',
      300: '#ffd230',
      400: '#fcbb1c',
      500: '#f2a029',
      600: '#d97706',
      700: '#a55a05',
      800: '#88470d',
      900: '#733b11',
      950: '#431e05',
    },
    colorScheme: {
      dark: {
        surface: {
          0: '#ffffff',
          50: '#fafafa',
          100: '#e5e5e5',
          200: '#d1d5db',
          300: '#a1a1a1',
          400: '#737373',
          500: '#525252',
          600: '#404040',
          700: '#262626',
          800: '#1c1c1c',
          900: '#131313',
          950: '#0a0a0a',
        },
      },
    },
  },
});
