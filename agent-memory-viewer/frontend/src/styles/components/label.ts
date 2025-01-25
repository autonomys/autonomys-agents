import { BadgeProps } from '@chakra-ui/react';

export const labelStyles: { baseStyle: BadgeProps } = {
  baseStyle: {
    fontSize: '0.8em',
    px: 2,
    py: 0.5,
    borderRadius: 'full',
    textTransform: 'uppercase' as const,
    fontWeight: 'bold',
    letterSpacing: '0.05em',
    boxShadow: 'sm',
    _hover: {
      transform: 'scale(1.05)',
      transition: 'transform 0.2s',
    },
  },
};
