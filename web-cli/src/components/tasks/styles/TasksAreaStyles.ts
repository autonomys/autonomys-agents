import { FlexProps, BoxProps, TextProps } from '@chakra-ui/react';

// Container styles
export const containerStyles: FlexProps = {
  direction: 'column',
  flex: '1',
  border: '1px solid',
  borderColor: 'gray.700',
  borderRadius: 'md',
  minHeight: '300px',
  height: '100%',
  width: '100%',
  bg: 'rgba(26, 26, 46, 0.6)',
  boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.3)',
  position: 'relative',
  pb: 2,
  mb: 0,
  display: 'flex',
};

// Content container styles
export const contentContainerStyles: BoxProps = {
  flex: '1',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
};

// Loading indicator styles
export const loadingContainerStyles: FlexProps = {
  position: 'absolute',
  bottom: '20px',
  right: '20px',
  bg: 'rgba(0, 0, 0, 0.7)',
  p: 2,
  borderRadius: 'md',
  alignItems: 'center',
  gap: 2,
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
  border: '1px solid',
  borderColor: 'gray.700',
  zIndex: '1',
};

// Loading text styles
export const loadingTextStyles: TextProps = {
  fontSize: 'sm',
  color: 'whiteAlpha.800',
};

// Resizable properties
export const resizableDefaultSize = {
  width: '100%',
  height: 400,
};

export const resizableEnableProps = {
  top: false,
  right: false,
  bottom: true,
  left: false,
};
