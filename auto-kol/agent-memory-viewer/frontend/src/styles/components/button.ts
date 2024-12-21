import { colors } from '../theme/colors';

export const buttonStyles = {
    primary: {
        colorScheme: 'green',
        variant: 'outline',
        color: colors.primary,
        borderColor: colors.primary,
        _hover: {
            bg: colors.background.light,
            boxShadow: `0 0 10px ${colors.primary}`
        }
    },
    pagination: {
        size: 'sm',
        variant: 'outline',
        colorScheme: 'green'
    }
}; 