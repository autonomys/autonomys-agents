import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import {
    VStack,
    Box,
    Text,
    HStack,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
    messageContainerStyle,
    messageHeaderStyle,
    aiIconStyle,
    messageBoxStyle,
} from '../styles/MessageList.styles';
import {colors} from "../theme/colors"
interface MessageListProps {
    messages: Message[];
}

function MessageList({ messages }: MessageListProps) {
    return (
        <VStack spacing={4} align="stretch">
            {messages.map((message, index) => {
                const isAI3 = message.role === 'assistant' && message.content.includes('AI3');
                
                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Box
                            {...messageContainerStyle}
                            alignItems={message.role === 'user' ? 'flex-end' : 'flex-start'}
                        >
                            <HStack {...messageHeaderStyle}>
                                {message.role !== 'user' && (
                                    <Box {...aiIconStyle(isAI3)}>
                                        🤖
                                    </Box>
                                )}
                                <Text color={colors.text.light.primary} fontSize="sm">
                                    {message.role === 'user' ? 'You' : 'Agent'}
                                </Text>
                                <Text color="whiteAlpha.500">•</Text>
                                <Text color="whiteAlpha.700">
                                    {format(message.timestamp, 'HH:mm')}
                                </Text>
                            </HStack>

                            <Box {...messageBoxStyle(message.role === 'user', isAI3)}>
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                            </Box>
                        </Box>
                    </motion.div>
                );
            })}
        </VStack>
    );
}

export default MessageList; 