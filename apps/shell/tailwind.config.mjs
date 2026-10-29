import preset from '@ridersclub/ui/tailwind.preset';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../community/src/**/*.{ts,tsx}',
    '../rides/src/**/*.{ts,tsx}',
    '../help/src/**/*.{ts,tsx}',
    '../mechanics/src/**/*.{ts,tsx}',
    '../garage/src/**/*.{ts,tsx}',
    '../marketplace/src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};
