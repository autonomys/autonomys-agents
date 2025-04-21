import { FlexProps, HeadingProps } from '@chakra-ui/react';

// Header container styles
export const headerContainerStyles: FlexProps = {
  justifyContent: 'space-between',
  alignItems: 'center',
  p: 4,
  borderBottom: '1px solid',
  borderColor: 'gray.600',
  bg: 'rgba(26, 26, 46, 0.8)',
  backdropFilter: 'blur(8px)',
  position: 'relative',
  _before: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    bgGradient: 'linear(to-r, transparent, brand.neonBlue, transparent)',
  },
};

// Heading styles
export const headingStyles: HeadingProps = {
  as: 'h3',
  size: 'md',
  color: 'brand.neonGreen',
  textShadow: '0 0 5px rgba(0, 255, 153, 0.5)',
  fontSize: ['md', 'lg', 'xl'],
};
