import {  ChakraProps } from '@chakra-ui/react'
import {  colors } from '../theme/colors'

export const styles = {
  mainContainer: {
    minH: "100vh",
    bgGradient: "linear(to-b, blue.900, gray.900)",
    position: "relative",
  } as ChakraProps,

  backgroundDots: {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    opacity: 0.1,
    zIndex: 0,
    bgImage: "url('data:image/svg+xml,%3Csvg...')"
  } as ChakraProps,

  header: {
    bg: "rgba(0, 0, 0, 0.3)",
    backdropFilter: "blur(10px)",
    py: 6,
    position: "sticky",
    top: "0",
    zIndex: 10,
    borderBottom: "1px",
    borderColor: "whiteAlpha.200"
  } as ChakraProps,

  headerTitle: {
    size: "lg",
    bgGradient: "linear(to-r, blue.400, cyan.400)",
    bgClip: "text",
    letterSpacing: "tight",
    display: "flex",
    alignItems: "center",
    gap: 3
  } as ChakraProps,

  aiPoweredBadge: {
    ml: "auto",
    fontSize: "sm",
    color: colors.text.light.secondary,
    px: 5,
    py: 1,
    borderRadius: "full",
    bg: "whiteAlpha.100",
    border: "1px",
    borderColor: "blue.500"
  } as ChakraProps,

  chatContainer: {
    bg: "rgba(0, 0, 0, 0.4)",
    borderRadius: "2xl",
    shadow: "2xl",
    height: "calc(100vh - 180px)",
    overflow: "hidden",
    border: "1px",
    borderColor: "whiteAlpha.200",
    backdropFilter: "blur(12px)",
    position: "relative",
  } as ChakraProps,

  chatContainerBefore: {
    content: "''",
    position: 'absolute',
    top: "0",
    left: "0",
    right: "0",
    height: '100px',
    bgGradient: 'linear(to-b, rgba(0,0,0,0.2), transparent)',
    pointerEvents: 'none',
    zIndex: 1
  } as ChakraProps,

  messageArea: {
    flex: "1",
    w: "full",
    overflowY: "auto",
    p: 6,
    position: "relative",
    sx: {
      '&::-webkit-scrollbar': {
        width: '4px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
      },
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent',
    }
  } as ChakraProps,

  inputBox: {
    w: "full",
    p: 4,
    borderTop: "1px",
    borderColor: "whiteAlpha.200",
    bg: "rgba(0, 0, 0, 0.3)",
    backdropFilter: "blur(12px)"
  } as ChakraProps
}