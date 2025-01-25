import { TextProps } from '@chakra-ui/react';

export const textStyles: Record<string, TextProps> = {
  heading: {
    color: '#00ff00',
    fontSize: 'md',
    fontWeight: 'bold',
    textShadow: '0 0 5px #00ff00',
    letterSpacing: '1px',
    mb: 2,
  },
  label: {
    color: 'rgba(0, 255, 0, 0.8)',
    fontSize: 'sm',
    letterSpacing: '0.5px',
  },
  value: {
    color: '#00ff00',
    fontSize: 'sm',
    fontFamily: 'Monaco, monospace',
  },
  noData: {
    color: 'rgba(0, 255, 0, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
    textShadow: '0 0 3px #00ff00',
  },
};
