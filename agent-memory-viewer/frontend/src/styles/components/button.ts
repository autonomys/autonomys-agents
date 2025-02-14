export const buttonStyles = {
  primary: {
    variant: 'outline',
    color: '#00ff00',
    borderColor: '#00ff00',
    bg: 'rgba(0, 17, 0, 0.7)',
    backdropFilter: 'blur(5px)',
    transition: 'all 0.3s ease',
    textShadow: '0 0 5px #00ff00',
    _hover: {
      bg: 'rgba(0, 255, 0, 0.1)',
      boxShadow: '0 0 15px #00ff00',
      transform: 'translateY(-2px)',
    },
    _active: {
      bg: 'rgba(0, 255, 0, 0.2)',
      transform: 'translateY(1px)',
    },
  },
  pagination: {
    size: 'sm',
    variant: 'outline',
    colorScheme: 'green',
  },
};
