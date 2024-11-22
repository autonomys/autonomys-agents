export const styles = {
    textarea: {
      bg: "rgba(255, 255, 255, 0.95)",
      border: "none",
      _hover: { border: "none" },
      _focus: {
        border: "none",
        boxShadow: "none"
      },
      borderRadius: "xl",
      color: "gray.800",
      fontSize: "md",
      fontFamily: "Inter, -apple-system, system-ui, sans-serif",
      fontWeight: "500",
      lineHeight: "1.6",
      py: 3,
      px: 5,
      sx: {
        '&::placeholder': {
          color: 'gray.400',
          fontSize: "md",
          fontWeight: "400"
        },
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#CBD5E0',
          borderRadius: '4px'
        },
        display: 'flex',
        alignItems: 'center',
      }
    },
  
    sendButton: {
      bg: "#7C3AED",
      color: "white",
      minW: "50px",
      h: "50px",
      p: 0,
      borderRadius: "xl",
      _hover: { bg: "#6D28D9" },
      _active: { bg: "#5B21B6" },
      _disabled: {
        bg: "#7C3AED !important",
        opacity: 0.6,
        cursor: "not-allowed"
      }
    }
  }