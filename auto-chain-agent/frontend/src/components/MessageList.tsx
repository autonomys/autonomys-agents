import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import {
    VStack,
    Box,
    Text,
    useColorModeValue
} from '@chakra-ui/react';

interface MessageListProps {
    messages: Message[];
}

function MessageList({ messages }: MessageListProps) {
    const userBg = useColorModeValue('blue.500', 'blue.400');
    const assistantBg = useColorModeValue('gray.100', 'gray.700');
    const errorBg = useColorModeValue('red.100', 'red.900');

    return (
        <VStack spacing={4} align="stretch">
            {messages.map((message, index) => (
                <Box
                    key={index}
                    display="flex"
                    flexDirection="column"
                    alignItems={message.role === 'user' ? 'flex-end' : 'flex-start'}
                >
                    <Box
                        maxW="80%"
                        p={4}
                        borderRadius="lg"
                        bg={
                            message.role === 'user'
                                ? userBg
                                : message.role === 'error'
                                    ? errorBg
                                    : assistantBg
                        }
                        color={message.role === 'user' ? 'white' : 'inherit'}
                    >
                        <Box
                            className="markdown-content"
                            sx={{
                                '& ul': {
                                    listStylePosition: 'inside',
                                    paddingLeft: '0',
                                    marginY: '0.5em'
                                },
                                '& li': {
                                    marginY: '0.25em'
                                },
                                '& p': {
                                    marginY: '0.5em'
                                }
                            }}
                        >
                            <ReactMarkdown>
                                {message.content}
                            </ReactMarkdown>
                        </Box>
                    </Box>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                        {format(message.timestamp, 'HH:mm')}
                    </Text>
                </Box>
            ))}
        </VStack>
    );
}

export default MessageList; 