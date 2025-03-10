import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          neonGreen: { value: '#00ff99' },
          neonPink: { value: '#ff00cc' },
          neonBlue: { value: '#00ccff' },
          darkBlue: { value: '#001830' },
          darkPurple: { value: '#440027' },
          background: { value: '#1a1a2e' },
        },
      },
      fonts: {
        heading: { value: '"VT323", "Courier New", monospace' },
        body: { value: '"Courier New", monospace' },
      },
    },
    semanticTokens: {
      colors: {
        headerBg: { value: '{colors.brand.background}' },
        headerBorder: { value: '{colors.brand.neonGreen}' },
        headingColor: { value: '{colors.brand.neonGreen}' },
      },
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);

export default system;
