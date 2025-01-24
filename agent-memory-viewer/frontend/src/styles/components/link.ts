import { colors } from '../theme/colors';

export const linkStyles = {
  baseStyle: {
    color: colors.primary,
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    _hover: {
      textDecoration: 'none',
      color: colors.text.primary,
      opacity: 0.8,
    },
  },
};
