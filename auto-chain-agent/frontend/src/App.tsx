import { useState, useRef, useEffect } from 'react';
import { Box, Container, Heading, VStack } from '@chakra-ui/react';
import ChatInput from './components/ChatInput';
import MessageList from './components/MessageList';
import { Message } from './types';
import { sendMessage } from './api';

function App() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (content: string) => {
        if (!content.trim()) return;

        const userMessage: Message = {
            role: 'user',
            content,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setLoading(true);

        try {
            const response = await sendMessage(content, currentThreadId);
            setCurrentThreadId(response.threadId);

            const assistantMessage: Message = {
                role: 'assistant',
                content: response.response,
                timestamp: new Date(),
                toolCalls: response.toolCalls
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                role: 'error',
                content: 'Sorry, there was an error processing your request.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box minH="100vh" bg="gray.50">
            <Box bg="white" py={4} shadow="sm">
                <Container maxW="container.xl">
                    <Heading size="lg" color="gray.700">Autonomys Network - Chain Agent</Heading>
                </Container>
            </Box>

            <Container maxW="container.xl" py={8}>
                <Box
                    bg="white"
                    borderRadius="lg"
                    shadow="base"
                    height="calc(100vh - 180px)"
                    overflow="hidden"
                >
                    <VStack h="full" spacing={0}>
                        <Box flex="1" w="full" overflowY="auto" p={4}>
                            <MessageList messages={messages} />
                            <div ref={messagesEndRef} />
                        </Box>

                        <Box w="full" p={4} borderTop="1px" borderColor="gray.100">
                            <ChatInput
                                onSendMessage={handleSendMessage}
                                disabled={loading}
                            />
                        </Box>
                    </VStack>
                </Box>
            </Container>
        </Box>
    );
}

export default App; 