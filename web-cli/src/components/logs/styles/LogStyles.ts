import { BoxProps, FlexProps, TextProps, ButtonProps, InputProps } from '@chakra-ui/react';

// Styles for the Metadata component
export const metadataContainer: BoxProps = {
  mt: '2',
  ml: '2',
  fontSize: ['xs', 'sm'],
};

// Custom styling for the right panel layout
export const customOutputLogContainer = {
  flex: { base: '1', md: '0.6' },
  height: { base: '100%' }, // Responsive height
  position: 'relative',
  zIndex: '1',
  borderLeft: { base: 'none', md: '1px solid' },
  borderColor: { base: 'transparent', md: 'rgba(0, 255, 153, 0.3)' },
  boxShadow: { base: 'none', md: 'inset 3px 0 5px rgba(0, 0, 0, 0.2)' },
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  bg: 'black',
  marginTop: '8px', // Reduced margin to better align with Status box
  marginLeft: '8px',
  borderRadius: 'md',
};

export const metadataContentContainer: BoxProps = {
  overflowY: 'auto',
  bg: 'rgba(10, 10, 15, 0.4)',
  borderRadius: 'md',
  mt: '2',
  borderLeft: '1px solid',
  borderColor: 'gray.700',
  borderTop: '1px solid',
  borderTopColor: 'gray.700',
  borderBottom: '1px solid',
  borderBottomColor: 'gray.700',
  borderRight: '1px solid',
  borderRightColor: 'gray.700',
  color: 'white',
  fontSize: ['xs', 'sm'],
  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)',
  css: {
    '&::-webkit-scrollbar': {
      width: '6px',
      borderRadius: '3px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(0, 0, 0, 0.1)',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 0, 204, 0.3)',
      borderRadius: '3px',
    },
  },
};

// Styles for the ObjectNode component
export const objectNodeContainer: BoxProps = {
  mt: 1,
  borderRadius: 'md',
  position: 'relative',
};

export const getObjectNodeHeader = (depth: number): FlexProps => ({
  alignItems: 'center',
  bg: `rgba(0, 0, 0, ${0.1 + depth * 0.05})`,
  p: 1,
  borderRadius: 'md',
  _hover: { bg: `rgba(0, 10, 20, ${0.2 + depth * 0.05})` },
  transition: 'all 0.2s',
});

export const objectNodeToggleButton: ButtonProps = {
  variant: 'ghost' as 'ghost',
  colorScheme: 'blue',
  p: 0,
  minW: '24px',
  height: '24px',
  mr: 1,
  size: 'xs',
};

export const getObjectNodeChildrenContainer = (isArray: boolean): BoxProps => ({
  pl: 3,
  borderColor: isArray ? 'rgba(21, 101, 192, 0.3)' : 'rgba(0, 188, 212, 0.3)',
  mt: 1,
  ml: 1,
});

// Styles for the MetadataValue component
export const metadataValueContainer: BoxProps = {
  mt: 1,
  p: 1,
  borderRadius: 'sm',
  _hover: { bg: 'rgba(0, 0, 0, 0.15)' },
  transition: 'all 0.2s',
};

export const metadataValueIndexLabel: TextProps = {
  color: 'blue.400',
  fontSize: 'xs',
  width: '30px',
  opacity: 0.8,
};

export const metadataValueNameLabel: TextProps = {
  fontWeight: 'bold',
  color: 'cyan.300',
  mr: 1,
};

export const metadataValueText: TextProps = {
  as: 'span',
  wordBreak: 'break-word',
};

export const getMetadataValueExpandButton = (isExpanded: boolean): BoxProps => ({
  as: 'button',
  display: 'flex',
  alignItems: 'center',
  ml: 2,
  height: '20px',
  px: 2,
  py: 0,
  fontSize: 'xs',
  fontWeight: 'medium',
  color: isExpanded ? 'orange.300' : 'blue.300',
  bg: isExpanded ? 'rgba(255, 126, 0, 0.1)' : 'rgba(0, 120, 255, 0.1)',
  border: '1px solid',
  borderColor: isExpanded ? 'orange.600' : 'blue.600',
  borderRadius: 'md',
  _hover: {
    bg: isExpanded ? 'rgba(255, 126, 0, 0.2)' : 'rgba(0, 120, 255, 0.2)',
    boxShadow: '0 0 5px rgba(120, 120, 255, 0.3)',
  },
  _active: {
    bg: isExpanded ? 'rgba(255, 126, 0, 0.3)' : 'rgba(0, 120, 255, 0.3)',
  },
  cursor: 'pointer',
});

export const metadataValueTypeLabel: TextProps = {
  as: 'span',
  fontSize: 'xs',
  ml: 2,
  color: 'gray.500',
  opacity: 0.6,
};

export const metadataValueExpandedContent: BoxProps = {
  mt: 2,
  px: 4,
  py: 2,
  bg: 'rgba(0, 0, 0, 0.15)',
  borderRadius: 'md',
  overflowY: 'auto',
  css: {
    '&::-webkit-scrollbar': {
      width: '4px',
      borderRadius: '2px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(0, 0, 0, 0.1)',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 126, 0, 0.3)',
      borderRadius: '2px',
    },
  },
};

export const metadataValueExpandedText: TextProps = {
  as: 'span',
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
  fontSize: 'xs',
  color: 'orange.300',
};

// Styles for the LogMessageList component
export const logMessageListContainer: BoxProps = {
  flex: '1',
  overflowY: 'auto',
  p: 4,
  bg: 'rgba(20, 20, 30, 0.7)',
  backdropFilter: 'blur(5px)',
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'Monaco', monospace",
  color: 'white',
  whiteSpace: 'pre-wrap',
  fontSize: ['sm', 'md'],
  lineHeight: '1.6',
  letterSpacing: '0.02em',
  css: {
    '&::-webkit-scrollbar': {
      width: '8px',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(0, 0, 0, 0.1)',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 0, 204, 0.3)',
      borderRadius: '4px',
    },
  },
};

export const logMessageListWelcomeText: TextProps = {
  color: 'brand.neonPink',
  fontSize: ['md', 'lg', 'xl'],
  fontStyle: 'italic',
  textAlign: 'center',
  my: 8,
  textShadow: '0 0 15px rgba(255, 0, 204, 0.5)',
  fontWeight: 'medium',
  letterSpacing: 'wide',
};

export const logMessageListLegacyMessage: BoxProps = {
  mb: 3,
  p: 3,
  borderRadius: 'md',
  bg: 'rgba(0, 0, 0, 0.2)',
  borderLeft: '3px solid',
  borderColor: 'gray.600',
  position: 'relative',
  transition: 'all 0.2s ease',
  _hover: {
    bg: 'rgba(0, 0, 0, 0.3)',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
  },
  fontSize: ['xs', 'sm'],
};

// Styles for search functionality
export const searchHighlight: TextProps = {
  bg: 'yellow.500',
  color: 'black',
  fontWeight: 'bold',
  px: '1px',
  mx: '-1px',
  borderRadius: '2px',
  textShadow: 'none',
};

// Modify getLogMessageListMessageBox to handle search matches
export const getLogMessageListMessageBox = (
  color: string,
  isSearchMatch: boolean = false,
  isCurrentSearchMatch: boolean = false,
): BoxProps => ({
  mb: 3,
  p: 3,
  borderRadius: 'md',
  bg: isCurrentSearchMatch
    ? 'rgba(255, 204, 0, 0.08)'
    : isSearchMatch
      ? 'rgba(255, 204, 0, 0.05)'
      : 'rgba(0, 0, 0, 0.2)',
  borderLeft: '3px solid',
  borderColor: isCurrentSearchMatch ? 'yellow.400' : color,
  position: 'relative',
  transition: 'all 0.2s ease',
  _hover: {
    bg: isCurrentSearchMatch
      ? 'rgba(255, 204, 0, 0.12)'
      : isSearchMatch
        ? 'rgba(255, 204, 0, 0.08)'
        : 'rgba(0, 0, 0, 0.3)',
    boxShadow: isCurrentSearchMatch
      ? '0 0 15px rgba(255, 204, 0, 0.2)'
      : '0 0 12px rgba(0, 0, 0, 0.3)',
  },
  _before: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '3px',
    height: '100%',
    bg: isCurrentSearchMatch ? 'yellow.400' : color,
    boxShadow: isCurrentSearchMatch ? '0 0 8px rgba(255, 204, 0, 0.7)' : `0 0 8px ${color}`,
  },
});

export const logMessageListTimestamp: TextProps = {
  color: 'gray.400',
  fontWeight: '500',
  fontSize: ['xs', 'sm'],
  letterSpacing: '0.03em',
};

export const logMessageListNamespace: TextProps = {
  color: 'brand.neonBlue',
  fontWeight: '600',
  fontSize: ['xs', 'sm'],
  letterSpacing: '0.03em',
};

export const getLogMessageListLevel = (color: string): TextProps => ({
  color: color,
  fontWeight: '600',
  fontSize: ['xs', 'sm'],
  letterSpacing: '0.03em',
  textShadow: `0 0 5px ${color}`,
});

export const logMessageListMessage: TextProps = {
  color: 'white',
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
  fontSize: ['xs', 'sm'],
  fontWeight: 'normal',
  lineHeight: '1.6',
  letterSpacing: '0.02em',
};

// Styles for OutputLog component
export const outputLogContainer: BoxProps = {
  position: 'relative',
  zIndex: 10,
  style: {
    transform: 'translate3d(0, 0, 0)',
    willChange: 'transform',
  },
};

export const outputLogFlexContainer: FlexProps = {
  direction: 'column',
  h: '100%',
  w: '100%',
  bg: 'rgba(26, 26, 46, 0.8)',
  borderRadius: 'lg',
  overflow: 'visible',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  border: '1px solid',
  borderColor: 'gray.700',
  position: 'relative',
  _before: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    bgGradient: 'linear(to-r, transparent, brand.neonPink, transparent)',
    zIndex: '1',
  },
};

export const scrollToBottomButton = (isScrolling: boolean): ButtonProps => ({
  size: 'md',
  position: 'fixed',
  bottom: '30px',
  right: '30px',
  colorScheme: 'pink',
  borderRadius: 'full',
  boxShadow: `0 0 15px rgba(255, 0, 255, ${isScrolling ? '0.9' : '0.7'})`,
  opacity: isScrolling ? 1 : 0.85,
  _hover: {
    opacity: 1,
    transform: 'scale(1.1)',
  },
  fontSize: '18px',
  width: '40px',
  height: '40px',
  padding: '0',
  zIndex: 100,
  transition: 'all 0.2s ease',
  animation: isScrolling ? 'pulse 1s infinite' : 'none',
});

// Styles for LogSearch component
export const logSearchContainer: BoxProps = {
  p: 2,
  mb: 2,
  position: 'relative',
  bg: 'rgba(20, 20, 40, 0.7)',
  borderRadius: 'md',
  borderBottom: '1px solid',
  borderColor: 'gray.700',
};

export const logSearchInput: InputProps = {
  bg: 'rgba(0, 0, 0, 0.3)',
  borderColor: 'gray.700',
  color: 'white',
  pl: '35px',
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'Monaco', monospace",
  letterSpacing: '0.02em',
  _placeholder: { color: 'gray.500' },
  _hover: {
    borderColor: 'brand.neonPink',
  },
  _focus: {
    borderColor: 'brand.neonPink',
    boxShadow: '0 0 0 1px #ff00cc',
  },
};

export const logSearchNavButton: ButtonProps = {
  size: 'xs',
  variant: 'ghost',
  colorScheme: 'pink',
  mx: 1,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'Monaco', monospace",
};

export const logSearchResultCount: TextProps = {
  fontSize: 'xs',
  color: 'gray.300',
  flex: 1,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'Monaco', monospace",
  letterSpacing: '0.02em',
};

// Styles for LogSearch component (floating overlay)
export const logSearchOverlay: FlexProps = {
  position: 'fixed',
  top: '20px',
  right: '20px',
  transform: 'none',
  width: 'auto',
  maxWidth: '450px',
  minWidth: '320px',
  zIndex: 9999,
  bg: 'rgba(10, 10, 25, 0.95)',
  backdropFilter: 'blur(8px)',
  p: 3,
  borderRadius: 'md',
  border: '1px solid',
  borderColor: 'brand.neonPink',
  boxShadow: '0 0 20px rgba(255, 0, 204, 0.3)',
  alignItems: 'center',
  _before: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    bgGradient: 'linear(to-r, transparent, brand.neonPink, transparent)',
  },
};

// Styles for font size controls in Metadata component
export const fontSizeControlsContainer: FlexProps = {
  ml: 'auto',
  alignItems: 'center',
  bg: '#121218',
  borderRadius: 'md',
  overflow: 'hidden',
  border: '1px solid',
  borderColor: 'rgba(255, 0, 204, 0.4)',
  position: 'relative',
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
};

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
