export const getTypeColor = (type: string) => {
  switch (type) {
    case 'approved':
    case 'response':
      return 'green.400';
    case 'rejected':
      return 'red.400';
    case 'skipped':
      return 'yellow.400';
    case 'posted':
      return 'blue.400';
    default:
      return 'gray.400';
  }
};

export const getTypeColorScheme = (type: string | undefined): string => {
  if (!type) return 'gray';

  const colorSchemes = [
    'teal',
    'blue',
    'cyan',
    'purple',
    'pink',
    'orange',
    'yellow',
    'green',
    'red',
  ];

  const hash = type.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colorSchemes[Math.abs(hash) % colorSchemes.length];
};
