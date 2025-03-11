import { BoxProps, FlexProps, ButtonProps, InputProps } from '@chakra-ui/react';

// Container styles
export const chatContainerStyles: BoxProps = {
  p: 4,
  bg: 'rgba(12, 15, 30, 0.85)',
  borderRadius: 'lg',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(8px)',
  border: '1px solid',
  borderColor: 'rgba(99, 110, 150, 0.2)',
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
    bgGradient: 'linear(to-r, transparent, brand.neonBlue, transparent)',
  },
  _after: {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: '10%',
    right: '10%',
    height: '1px',
    bgGradient: 'linear(to-r, transparent, rgba(0, 204, 255, 0.3), transparent)',
  },
};

// Header styles
export const headerStyles: FlexProps = {
  justify: 'space-between',
  align: 'center',
  mb: 4,
  pb: 3,
  borderBottom: '1px solid rgba(60, 70, 100, 0.3)',
};

export const headingStyles: any = {
  as: 'h3',
  size: 'md',
  color: 'brand.neonBlue',
  textShadow: '0 0 5px rgba(0, 204, 255, 0.5)',
  fontSize: ['md', 'lg', 'xl'],
  display: 'flex',
  alignItems: 'center',
};

export const statusDotStyles: BoxProps = {
  as: 'span',
  mr: 2,
  borderRadius: 'full',
  width: '10px',
  height: '10px',
  bg: 'rgba(0, 204, 255, 0.8)',
  boxShadow: '0 0 8px rgba(0, 204, 255, 0.8)',
  animation: 'pulseEffect 2s infinite',
};

export const closeButtonStyles: ButtonProps = {
  size: 'sm',
  variant: 'ghost',
  minWidth: '32px',
  height: '32px',
  p: 0,
  borderRadius: 'full',
  bg: 'rgba(255, 0, 0, 0.05)',
  border: '1px solid rgba(255, 0, 0, 0.3)',
  color: 'red.300',
  position: 'relative',
  _hover: {
    bg: 'rgba(255, 0, 0, 0.15)',
    boxShadow: '0 0 15px rgba(255, 0, 0, 0.4)',
    transform: 'scale(1.05)',
  },
  _active: {
    bg: 'rgba(255, 0, 0, 0.2)',
    transform: 'scale(0.95)',
  },
  _after: {
    content: '""',
    position: 'absolute',
    top: '-1px',
    left: '10%',
    right: '10%',
    height: '1px',
    bgGradient: 'linear(to-r, transparent, red.300, transparent)',
    opacity: 0.7,
  },
  transition: 'all 0.2s ease',
};

// Chat messages area styles
export const messagesAreaStyles: BoxProps = {
  flex: '1',
  overflowY: 'auto',
  mb: 4,
  px: 3,
  py: 2,
  borderRadius: 'md',
  position: 'relative',
  css: {
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
    '&::-webkit-scrollbar-thumb:hover': {
      background: 'rgba(0, 204, 255, 0.5)',
    },
  },
};

// Loading state styles
export const loadingContainerStyles: FlexProps = {
  justify: 'center',
  align: 'center',
  height: '100%',
  flexDirection: 'column',
  color: 'whiteAlpha.700',
};

// Avatar styles
export const getAvatarStyles = (isUser: boolean): FlexProps => ({
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 'full',
  width: '38px',
  height: '38px',
  bg: isUser ? 'rgba(255, 0, 204, 0.2)' : 'rgba(0, 204, 255, 0.2)',
  color: 'white',
  mr: isUser ? 0 : 3,
  ml: isUser ? 3 : 0,
  border: '1px solid',
  borderColor: isUser ? 'brand.neonPink' : 'brand.neonBlue',
  boxShadow: `0 0 10px ${isUser ? 'rgba(255, 0, 204, 0.3)' : 'rgba(0, 204, 255, 0.3)'}`,
  fontSize: 'sm',
  fontWeight: 'bold',
  position: 'relative',
  overflow: 'hidden',
  _before: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    bgGradient: isUser
      ? 'linear(to-r, transparent, brand.neonPink, transparent)'
      : 'linear(to-r, transparent, brand.neonBlue, transparent)',
  },
});

// Message bubble styles
export const getMessageBubbleStyles = (isUser: boolean): BoxProps => ({
  maxWidth: '85%',
  bg: isUser ? 'rgba(255, 0, 204, 0.08)' : 'rgba(0, 204, 255, 0.08)',
  px: 5,
  py: 3,
  borderRadius: 'lg',
  border: '1px solid',
  borderColor: isUser ? 'rgba(255, 0, 204, 0.3)' : 'rgba(0, 204, 255, 0.3)',
  position: 'relative',
  boxShadow: isUser ? '0 2px 10px rgba(255, 0, 204, 0.1)' : '0 2px 10px rgba(0, 204, 255, 0.1)',
  _before: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: isUser ? 'auto' : '0',
    right: isUser ? '0' : 'auto',
    width: '70%',
    height: '1px',
    bgGradient: isUser
      ? 'linear(to-l, transparent, rgba(255, 0, 204, 0.5))'
      : 'linear(to-r, transparent, rgba(0, 204, 255, 0.5))',
  },
});

// Divider styles
export const dividerStyles: BoxProps = {
  height: '1px',
  width: '100%',
  bgGradient: 'linear(to-r, transparent, rgba(99, 110, 150, 0.5), transparent)',
  mb: 6,
};

// Input area styles
export const inputContainerStyles: FlexProps = {
  position: 'relative',
  mb: 3,
  mt: 2,
  px: 2,
};

export const inputMessageStyles: BoxProps = {
  position: 'absolute',
  top: '-18px',
  left: '50%',
  transform: 'translateX(-50%)',
  bg: 'rgba(12, 15, 30, 1)',
  px: 4,
  py: 1,
  borderRadius: 'md',
  fontSize: 'xs',
  color: 'gray.400',
  zIndex: '1',
  pointerEvents: 'none',
  transition: 'opacity 0.3s ease',
  border: '1px solid rgba(99, 110, 150, 0.2)',
};

export const inputStyles: InputProps = {
  bg: 'rgba(4, 10, 20, 0.5)',
  color: 'white',
  border: '1px solid',
  borderColor: 'rgba(99, 110, 150, 0.3)',
  height: '54px',
  fontSize: 'md',
  pl: 4,
  _hover: {
    borderColor: 'brand.neonBlue',
    boxShadow: '0 0 8px rgba(0, 204, 255, 0.4)',
  },
  _focus: {
    borderColor: 'brand.neonBlue',
    boxShadow: '0 0 12px rgba(0, 204, 255, 0.5)',
    outline: 'none',
  },
  _placeholder: {
    color: 'whiteAlpha.600',
  },
  mr: 3,
  position: 'relative',
  borderRadius: 'md',
  _before: {
    content: '""',
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    height: '1px',
    bgGradient: 'linear(to-r, transparent, rgba(0, 204, 255, 0.5), transparent)',
    zIndex: 1,
    opacity: 0.7,
  },
};

// Send button styles
export const sendButtonStyles: ButtonProps = {
  bg: 'rgba(4, 10, 20, 0.6)',
  color: 'brand.neonBlue',
  border: '1px solid',
  borderColor: 'brand.neonBlue',
  height: '54px',
  minWidth: '100px',
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 'md',
  _hover: {
    bg: 'rgba(0, 204, 255, 0.15)',
    boxShadow: '0 0 15px rgba(0, 204, 255, 0.5)',
    transform: 'translateY(-2px)',
  },
  _active: {
    bg: 'rgba(0, 204, 255, 0.25)',
    transform: 'translateY(1px)',
  },
  _disabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    bg: 'rgba(4, 10, 20, 0.4)',
    _hover: {
      boxShadow: 'none',
      transform: 'none',
    },
  },
  transition: 'all 0.2s ease',
  _before: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    bg: 'rgba(0, 204, 255, 0.7)',
    animation: 'shimmer 2s infinite linear',
  },
};

// Resizable handle styles
export const resizableHandleStyles = {
  height: '8px',
  borderRadius: '0 0 6px 6px',
  backgroundColor: 'transparent',
  backgroundImage: 'linear-gradient(to right, transparent, rgba(0, 204, 255, 0.4), transparent)',
  bottom: '0px',
  cursor: 'row-resize',
};

// Typing indicator styles
export const typingIndicatorContainerStyles: FlexProps = {
  mb: 5,
  alignItems: 'flex-start',
};

export const typingDotsContainerStyles: FlexProps = {
  align: 'center',
  justify: 'center',
  width: '80px',
};

export const getTypingDotStyles = (delay: string): BoxProps => ({
  width: '10px',
  height: '10px',
  borderRadius: 'full',
  bg: 'rgba(0, 204, 255, 0.6)',
  mr: delay === '0.4s' ? 0 : 2,
  animation: 'pulseEffect 1s infinite',
  animationDelay: delay,
});

// Chat button styles (for opening a chat)
export const chatButtonStyles: ButtonProps = {
  size: 'sm',
  variant: 'ghost',
  minWidth: 'auto',
  width: '28px',
  height: '28px',
  p: 0,
  mt: 1,
  borderRadius: 'full',
  title: 'Chat with this namespace',
  position: 'relative',
  bg: 'rgba(0, 204, 255, 0.05)',
  border: '1px solid rgba(0, 204, 255, 0.3)',
  color: 'brand.neonBlue',
  _hover: {
    bg: 'rgba(0, 204, 255, 0.15)',
    boxShadow: '0 0 15px rgba(0, 204, 255, 0.5)',
    transform: 'translateY(-2px)',
  },
  _active: {
    bg: 'rgba(0, 204, 255, 0.25)',
    transform: 'translateY(0px)',
  },
  _after: {
    content: '""',
    position: 'absolute',
    top: '-1px',
    left: '5%',
    right: '5%',
    height: '1px',
    bgGradient: 'linear(to-r, transparent, brand.neonBlue, transparent)',
    opacity: 0.7,
  },
  transition: 'all 0.2s ease',
  overflow: 'hidden',
};

// Load older messages button styles
export const loadOlderButtonStyles: ButtonProps = {
  size: 'sm',
  variant: 'ghost',
  my: 2,
  mx: 'auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'brand.neonBlue',
  bg: 'rgba(0, 204, 255, 0.05)',
  border: '1px solid rgba(0, 204, 255, 0.3)',
  borderRadius: 'md',
  py: 2,
  px: 4,
  _hover: {
    bg: 'rgba(0, 204, 255, 0.1)',
    boxShadow: '0 0 10px rgba(0, 204, 255, 0.4)',
  },
  _active: {
    bg: 'rgba(0, 204, 255, 0.15)',
  },
  width: '150px',
  fontSize: 'sm',
  transition: 'all 0.2s ease',
};
