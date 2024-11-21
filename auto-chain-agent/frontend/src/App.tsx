import { useState, useRef, useEffect } from 'react';
import { Box, Container, Heading, VStack } from '@chakra-ui/react';
import ChatInput from './components/ChatInput';
import MessageList from './components/MessageList';
import { Message } from './types';
import { sendMessage } from './api';
import { styles } from './styles/App.styles';
import logo from './assets/logo.png';
import { TbBrain } from 'react-icons/tb';

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
        <Box {...styles.mainContainer}>
            <Box {...styles.backgroundDots} />

            <Box {...styles.header}>
                <Container maxW="container.xl">
                    <Heading {...styles.headerTitle}>
                        <Box as="img" src={logo} h="40px" />
                        Autonomys Network - Chain Agent
                        <Box {...styles.aiPoweredBadge}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <TbBrain style={{ width: '30px', height: '30px' }} /> 
                            Memory Enabled ⚡ 
                          </Box>
                        </Box>
                    </Heading>
                </Container>
            </Box>

            <Container maxW="container.xl" py={8} position="relative" zIndex={1}>
                <Box {...styles.chatContainer}>
                    <Box {...styles.chatContainerBefore} />
                    <VStack h="full" spacing={0}>
                        <Box {...styles.messageArea}>
                            <MessageList messages={messages} />
                            <div ref={messagesEndRef} />
                        </Box>

                        <Box {...styles.inputBox}>
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