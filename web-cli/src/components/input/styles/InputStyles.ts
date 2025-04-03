import {
  BoxProps,
  FlexProps,
  HeadingProps,
  TextareaProps,
  ButtonProps,
  TextProps,
} from '@chakra-ui/react';
import { CSSProperties } from 'react';

// Container styles
export const containerFlexStyles: FlexProps = {
  direction: 'column',
  gap: '4',
  w: '100%',
  h: '100%',
};

// Resizable properties
export const resizableDefaultSize = {
  width: '100%',
  height: 240,
};

export const resizableEnableProps = {
  top: false,
  right: false,
  bottom: true,
  left: false,
  topRight: false,
  bottomRight: false,
  bottomLeft: false,
  topLeft: false,
};

// Resizable handle styles
export const resizableHandleStyles = {
  height: '8px',
  borderRadius: '0 0 6px 6px',
  backgroundColor: 'transparent',
  backgroundImage: 'linear-gradient(to right, transparent, rgba(0, 255, 153, 0.4), transparent)',
  bottom: '0px',
  cursor: 'row-resize',
};

export const resizableHandleBoxStyles: BoxProps = {
  width: '100%',
  height: '8px',
  position: 'absolute',
  bottom: '0',
  cursor: 'row-resize',
  borderRadius: '0 0 6px 6px',
  _hover: {
    backgroundImage: 'linear-gradient(to right, transparent, rgba(0, 255, 153, 0.8), transparent)',
    opacity: 0.7,
  },
};

// Container box styles
export const containerBoxStyles: BoxProps = {
  p: 4,
  bg: 'rgba(26, 26, 46, 0.8)',
  borderRadius: 'md',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(8px)',
  border: '1px solid',
  borderColor: 'gray.700',
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  _before: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    bgGradient: 'linear(to-r, transparent, brand.neonGreen, transparent)',
  },
};

// Heading styles
export const headingStyles: HeadingProps = {
  as: 'h3',
  size: 'md',
  mb: 3,
  color: 'brand.neonGreen',
  textShadow: '0 0 5px rgba(0, 255, 153, 0.5)',
  fontSize: ['md', 'lg', 'xl'],
};

// Content flex styles
export const contentFlexStyles: FlexProps = {
  direction: 'column',
  flex: '1',
};

// Input area flex styles
export const inputAreaFlexStyles: FlexProps = {
  mb: 2,
  flex: '1',
  gap: 3,
};

// Textarea styles
export const textareaStyles: TextareaProps = {
  bg: 'rgba(0, 0, 0, 0.3)',
  color: 'white',
  border: '1px solid',
  borderColor: 'gray.600',
  _hover: {
    borderColor: 'brand.neonBlue',
    boxShadow: '0 0 5px rgba(0, 204, 255, 0.3)',
  },
  _focus: {
    borderColor: 'brand.neonGreen',
    boxShadow: '0 0 10px rgba(0, 255, 153, 0.3)',
    outline: 'none',
  },
  _placeholder: {
    color: 'whiteAlpha.500',
    fontSize: ['sm', 'md'],
  },
  resize: 'none',
  flex: '1',
  h: 'auto',
  overflowY: 'auto',
  p: 3,
  fontSize: ['sm', 'md'],
  transition: 'all 0.2s ease',
};

// Textarea scrollbar styles
export const textareaScrollbarStyles = {
  '&::-webkit-scrollbar': {
    width: '8px',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0, 0, 0, 0.1)',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(0, 255, 153, 0.3)',
    borderRadius: '4px',
  },
} as CSSProperties;

// Send button styles
export const sendButtonStyles: ButtonProps = {
  bg: 'rgba(0, 0, 0, 0.5)',
  color: 'brand.neonGreen',
  border: '1px solid',
  borderColor: 'brand.neonGreen',
  alignSelf: 'stretch',
  px: 4,
  py: 6,
  fontSize: ['sm', 'md'],
  fontWeight: 'medium',
  _hover: {
    bg: 'rgba(0, 255, 153, 0.2)',
    boxShadow: '0 0 15px rgba(0, 255, 153, 0.5)',
    transform: 'translateY(-2px)',
  },
  _active: {
    bg: 'rgba(0, 255, 153, 0.3)',
    transform: 'translateY(1px)',
  },
  transition: 'all 0.2s ease',
  position: 'relative',
  overflow: 'hidden',
  _before: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    bg: 'rgba(0, 255, 153, 0.7)',
    animation: 'shimmer 2s infinite linear',
  },
};

// Send button internal flex
export const sendButtonFlexStyles: FlexProps = {
  align: 'center',
  justify: 'center',
  gap: 2,
};

// Send button text styles
export const sendButtonTextStyles: TextProps = {
  as: 'span',
  ml: 1,
  className: 'send-icon',
  animation: 'floatEffect 2s infinite ease-in-out',
  fontSize: 'lg',
  fontWeight: 'bold',
};

// Send button animation overlay
export const sendButtonAnimationStyles: BoxProps = {
  position: 'absolute',
  top: '0',
  left: '0',
  right: '0',
  bottom: '0',
  pointerEvents: 'none',
  opacity: '0.4',
  zIndex: '-1',
  bgGradient: 'linear(to-r, transparent, rgba(0, 255, 153, 0.1), transparent)',
  animation: 'scannerEffect 2s infinite linear',
};

// Helper text styles
export const helperTextStyles: TextProps = {
  fontSize: ['xs', 'sm'],
  color: 'whiteAlpha.600',
  textAlign: 'right',
  mt: 1,
  fontStyle: 'italic',
};
