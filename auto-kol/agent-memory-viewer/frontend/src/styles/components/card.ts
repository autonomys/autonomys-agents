import { colors } from '../theme/colors';

export const cardStyles = {
    baseStyle: {
        bg: colors.background.dark,
        borderColor: colors.primary,
        borderWidth: '1px',
        borderRadius: 'md',
    },
    bodyStyle: {
        padding: 4,
    },
    hoverStyle: {
        _hover: {
            boxShadow: `0 0 10px ${colors.primary}`,
            borderColor: colors.primary,
        }
    }
}; 