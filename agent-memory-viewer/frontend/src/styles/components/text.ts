import { colors } from '../theme/colors';
import { TextProps } from '@chakra-ui/react';

export const textStyles: Record<string, TextProps> = {
    heading: {
        color: colors.text.primary,
        fontSize: 'md',
        fontWeight: 'bold',
        mb: 2
    },
    label: {
        color: colors.text.secondary,
        fontSize: 'sm'
    },
    value: {
        color: colors.text.primary,
        fontSize: 'sm'
    },
    noData: {
        color: colors.text.muted,
        textAlign: 'center' as const
    }
}; 