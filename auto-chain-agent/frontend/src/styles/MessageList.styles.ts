import { ChakraProps } from '@chakra-ui/react';

export const messageContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
} as const;

export const messageHeaderStyle = {
    spacing: 2,
    mb: 1,
    px: 4,
    fontSize: 'xs',
    width: '100%',
    pl: 3,
} as const;

export const aiIconStyle = (isAI3: boolean) => ({
    as: 'span',
    w: '24px',
    h: '24px',
    borderRadius: 'md',
    bg: isAI3 
        ? 'rgba(124, 58, 237, 0.3)'  // Purple for AI3
        : 'rgba(66, 153, 225, 0.3)', // Original blue
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid',
    borderColor: isAI3 
        ? 'rgba(124, 58, 237, 0.5)'  // Purple border for AI3
        : 'rgba(66, 153, 225, 0.5)', // Original blue border
} as const);

export const messageBoxStyle = (isUser: boolean, isAI3: boolean): ChakraProps => ({
    maxW: '70%',
    p: 3,
    bg: isUser
        ? 'linear-gradient(135deg, rgba(66, 153, 225, 0.4) 0%, rgba(66, 153, 225, 0.2) 100%)'
        : isAI3
            ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.4) 0%, rgba(124, 58, 237, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(45, 55, 72, 0.6) 0%, rgba(45, 55, 72, 0.4) 100%)',
    color: 'white',
    borderRadius: '2xl',
    boxShadow: isUser
        ? '0 4px 12px rgba(66, 153, 225, 0.1)'
        : '0 4px 12px rgba(0, 0, 0, 0.1)',
    border: '1px solid',
    borderColor: isUser
        ? 'rgba(66, 153, 225, 0.3)'
        : isAI3
            ? 'rgba(124, 58, 237, 0.3)'
            : 'rgba(255, 255, 255, 0.1)',
    borderTopRightRadius: isUser ? '4px' : '2xl',
    borderTopLeftRadius: isUser ? '2xl' : '4px',
    backdropFilter: 'blur(12px)',
    sx: {
        '& p': {
            margin: 0,
            lineHeight: '1.5',
        },
        '& ul, & ol': {
            paddingLeft: '1.5em',  
            marginTop: '0.5em',
            marginBottom: '0.5em',
        },
        '& li': {
            marginBottom: '0.25em', 
        },
        '& pre': {
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 'xl',
            p: 2,
            overflowX: 'auto',
            fontSize: '0.9em',
        },
        '& code': {
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '0.2em 0.4em',
            borderRadius: 'md',
            fontSize: '0.9em',
        },
    },
});