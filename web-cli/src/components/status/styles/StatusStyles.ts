import { BoxProps, HeadingProps, TextProps, ButtonProps } from '@chakra-ui/react';
import { CSSProperties } from 'react';

// Resizable handle styles
export const resizableHandleStyles = (statusColor: string) => ({
  height: '8px',
  borderRadius: '0 0 6px 6px',
  backgroundColor: 'transparent',
  backgroundImage: `linear-gradient(to right, transparent, ${statusColor}40, transparent)`,
  bottom: '0px',
  cursor: 'row-resize',
});

export const resizableHandleBoxStyles = (statusColor: string): BoxProps => ({
  width: '100%',
  height: '8px',
  position: 'absolute',
  bottom: '0',
  cursor: 'row-resize',
  borderRadius: '0 0 6px 6px',
  _hover: {
    backgroundImage: `linear-gradient(to right, transparent, ${statusColor}, transparent)`,
    opacity: 0.7,
  },
});

// Container box styles
export const containerBoxStyles: BoxProps = {
  p: 4,
  bg: 'rgba(26, 26, 46, 0.8)',
  borderRadius: 'md',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(8px)',
  border: '1px solid',
  borderColor: 'gray.700',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
};

export const containerBeforeStyles = (statusColor: string): any => ({
  content: '""',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '1px',
  bgGradient: `linear(to-r, transparent, ${statusColor}, transparent)`,
});

// Heading styles
export const headingStyles: HeadingProps = {
  as: 'h3',
  size: 'md',
  mb: 3,
  color: 'brand.neonGreen',
  textShadow: '0 0 5px rgba(0, 255, 153, 0.5)',
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  fontSize: ['md', 'lg', 'xl'],
};

export const statusDotStyles = (statusColor: string): BoxProps => ({
  as: 'span',
  w: '8px',
  h: '8px',
  borderRadius: 'full',
  bg: statusColor,
  boxShadow: `0 0 8px ${statusColor}`,
  animation: 'pulse 2s infinite',
});

// Status content box styles
export const statusContentBoxStyles = (statusColor: string, bgColor: string): BoxProps => ({
  p: 3,
  bg: bgColor,
  borderRadius: 'md',
  borderLeft: '3px solid',
  borderColor: statusColor,
  transition: 'all 0.2s ease',
  flex: '1',
  overflowY: 'auto',
  css: {
    '&::-webkit-scrollbar': {
      width: '6px',
      borderRadius: '3px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(0, 0, 0, 0.1)',
    },
    '&::-webkit-scrollbar-thumb': {
      background: `${statusColor}40`,
      borderRadius: '3px',
    },
  } as CSSProperties,
});

// Ready text styles
export const readyTextStyles = (statusColor: string): TextProps => ({
  fontWeight: '500',
  color: statusColor,
  fontSize: ['sm', 'md', 'lg'],
});

// Status label styles
export const statusLabelStyles = (statusColor: string, hasMessage: boolean): TextProps => ({
  fontWeight: '600',
  color: statusColor,
  mb: hasMessage ? 2 : 0,
  fontSize: ['sm', 'md', 'lg'],
});

// Status message styles
export const statusMessageStyles: TextProps = {
  fontSize: ['sm', 'md'],
  fontWeight: 'normal',
  color: 'whiteAlpha.800',
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
  lineHeight: '1.6',
};

// Stop button styles
export const stopButtonStyles: ButtonProps = {
  size: 'sm',
  colorScheme: 'red',
  variant: 'outline',
  ml: 'auto',
  position: 'relative',
  borderRadius: 'md',
  py: 1.5,
  px: 4,
  bg: 'rgba(239, 83, 80, 0.05)',
  color: '#ef5350',
  border: '1px solid',
  borderColor: 'rgba(239, 83, 80, 0.3)',
  overflow: 'hidden',
  transition: 'all 0.2s ease',
  _before: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    bg: 'rgba(239, 83, 80, 0.7)',
  },
  _hover: {
    bg: 'rgba(239, 83, 80, 0.15)',
    borderColor: 'rgba(239, 83, 80, 0.8)',
    boxShadow: '0 0 12px rgba(239, 83, 80, 0.5)',
    transform: 'translateY(-1px)',
    animation: 'none',
  },
  _active: {
    bg: 'rgba(239, 83, 80, 0.25)',
    transform: 'translateY(1px)',
  },
};

// Stop button text styles
export const stopButtonTextStyles: TextProps = {
  fontSize: 'md',
  fontWeight: '500',
};

// Stop button animation overlay styles
export const stopButtonAnimationStyles: BoxProps = {
  position: 'absolute',
  top: '0',
  left: '0',
  right: '0',
  bottom: '0',
  pointerEvents: 'none',
  opacity: '0.3',
  zIndex: '-1',
  bgGradient: 'linear(to-r, transparent, rgba(239, 83, 80, 0.2), transparent)',
  animation: 'scannerEffect 2s infinite linear',
};

// CSS styles for animations
export const animationStyles = {
  nodeRipple: 'nodeRipple 2s infinite',
};
