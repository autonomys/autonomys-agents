export const selectStyles = {
  // Base select styles (without width)
  baseStyle: {
    color: '#00ff00',
    borderColor: '#00ff00',
    bg: '#001100',
  },

  // Specific width styles
  filterWidth: {
    width: '200px',
  },

  paginationWidth: {
    width: 'auto',
  },

  // Hover state
  hoverStyle: {
    borderColor: '#00ff00',
    boxShadow: '0 0 10px #00ff00',
  },

  // Custom dropdown styles
  dropdownStyle: {
    option: {
      bg: '#001100',
      color: '#00ff00',
      padding: '10px',
      cursor: 'pointer',
      _hover: {
        bg: '#002200',
      },
    },
    '& > option': {
      bg: 'rgba(0, 17, 0, 0.95)',
      backdropFilter: 'blur(10px)',
    },
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      bg: '#001100',
    },
    '&::-webkit-scrollbar-thumb': {
      bg: '#00ff00',
      borderRadius: '4px',
    },
    '& option:checked': {
      bg: '#002200',
      _before: {
        content: '"✓ "',
        color: '#00ff00',
      },
    },
  },
};
