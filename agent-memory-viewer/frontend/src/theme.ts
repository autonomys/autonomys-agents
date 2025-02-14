import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: '#000000',
        color: '#00ff00',
        fontFamily: 'Monaco, "Courier New", monospace',
        backgroundImage: 'radial-gradient(#003300 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        backgroundPosition: '-25px -25px',
      },
    },
  },
  components: {
    Card: {
      baseStyle: {
        container: {
          border: '2px solid #00ff00',
          borderStyle: 'outset',
          bg: '#001100',
          boxShadow: '0 0 10px #00ff00',
          color: '#00ff00',
        },
      },
    },
    Button: {
      baseStyle: {
        border: '2px outset #00ff00',
        bg: '#001100',
        color: '#00ff00',
        _hover: {
          bg: '#002200',
        },
      },
    },
  },
});

export default theme;
