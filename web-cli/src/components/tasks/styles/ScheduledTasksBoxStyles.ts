import { BoxProps, TextProps, ButtonProps, FlexProps, BadgeProps } from '@chakra-ui/react';
import { CSSProperties } from 'react';

// Resizable properties
export const resizableDefaultSize = {
  width: '100%',
  height: 200,
};

// Use CSSProperties for resizableStyles since it's passed to style prop
export const resizableStyles: CSSProperties = {
  margin: '0',
  flex: '1',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
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
  backgroundImage: 'linear-gradient(to right, transparent, rgba(0, 204, 255, 0.4), transparent)',
  bottom: '0px',
  cursor: 'row-resize',
  zIndex: 11,
};

export const resizableHandleBoxStyles: BoxProps = {
  width: '100%',
  height: '8px',
  position: 'absolute',
  bottom: '0',
  cursor: 'row-resize',
  borderRadius: '0 0 6px 6px',
  zIndex: 11,
  _hover: {
    backgroundImage: 'linear-gradient(to right, transparent, rgba(0, 204, 255, 0.8), transparent)',
    opacity: 0.7,
  },
};

// Container box styles
export const containerBoxStyles: BoxProps = {
  flex: '1',
  overflow: 'auto',
  p: 4,
  bg: 'rgba(20, 20, 20, 0.7)',
  backdropFilter: 'blur(5px)',
  height: '100%',
  width: '100%',
};

// Scrollbar styles
export const scrollbarStyles = {
  '&::-webkit-scrollbar': {
    width: '8px',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0, 0, 0, 0.1)',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(0, 204, 255, 0.3)',
    borderRadius: '4px',
  },
} as CSSProperties;

// Stack styles - use BoxProps instead of FlexProps to avoid direction type issue
export const stackStyles: BoxProps = {
  display: 'flex',
  flexDirection: 'column',
  w: '100%',
};

// Empty state styles
export const emptyStateStyles: BoxProps = {
  textAlign: 'center',
  py: 8,
  color: 'whiteAlpha.600',
  fontSize: ['sm', 'md'],
  fontStyle: 'italic',
  bgGradient: 'linear(to-b, rgba(0, 0, 0, 0), rgba(0, 204, 255, 0.05), rgba(0, 0, 0, 0))',
  borderRadius: 'md',
  p: 4,
};

// Task list styles
export const taskListStyles: BoxProps = {
  as: 'ul',
  m: 0,
  p: 0,
  listStyleType: 'none',
};

// Task item styles
export const getTaskItemStyles = (statusColor: string): BoxProps => ({
  as: 'li',
  p: 3,
  mb: 3,
  borderRadius: 'md',
  bg: 'rgba(0, 0, 0, 0.3)',
  border: '1px solid',
  borderColor: 'gray.700',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.2s ease',
  _hover: {
    borderColor: 'brand.neonBlue',
    boxShadow: '0 0 12px rgba(0, 204, 255, 0.2)',
  },
  _before: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '2px',
    height: '100%',
    bg: statusColor,
    boxShadow: `0 0 8px ${statusColor}`,
  },
});

// Task content flex styles
export const taskContentFlexStyles: FlexProps = {
  direction: 'column',
  gap: 2,
  pl: 2,
};

// Task header flex styles
export const taskHeaderFlexStyles: FlexProps = {
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

// Task timestamp text styles
export const taskTimestampStyles: TextProps = {
  fontSize: ['xs', 'sm'],
  color: 'whiteAlpha.700',
  fontFamily: 'monospace',
  fontWeight: 'medium',
};

// Delete button styles
export const deleteButtonStyles: ButtonProps = {
  size: 'sm',
  variant: 'ghost',
  color: 'gray.400',
  minW: 'auto',
  h: 'auto',
  p: 2,
  fontWeight: 'bold',
  fontSize: 'md',
  borderRadius: 'md',
  _hover: {
    bg: 'rgba(255, 0, 0, 0.2)',
    color: '#ef5350',
    transform: 'scale(1.05)',
  },
  _active: {
    bg: 'rgba(255, 0, 0, 0.3)',
    transform: 'scale(0.95)',
  },
};

// Task description text styles
export const getTaskDescriptionStyles = (hasStatus: boolean): TextProps => ({
  fontSize: ['sm', 'md'],
  fontWeight: 'medium',
  color: 'white',
  mb: hasStatus ? 2 : 0,
});

// Task status badge styles
export const getTaskStatusBadgeStyles = (statusColor: string): BadgeProps => ({
  w: 'fit-content',
  px: 2,
  py: 1,
  borderRadius: 'full',
  fontSize: ['xs', 'sm'],
  bg: `${statusColor}20`,
  color: statusColor,
  textTransform: 'capitalize',
  fontWeight: 'medium',
  boxShadow: `0 0 5px ${statusColor}50`,
});
