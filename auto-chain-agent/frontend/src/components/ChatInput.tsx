import { useState, KeyboardEvent } from 'react';
import {
    Button,
    Textarea,
    HStack,
    useColorModeValue
} from '@chakra-ui/react';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    disabled?: boolean;
}

function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
    const [message, setMessage] = useState('');

    const handleSubmit = () => {
        if (message.trim() && !disabled) {
            onSendMessage(message);
            setMessage('');
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const buttonBg = useColorModeValue('blue.500', 'blue.300');
    const buttonHoverBg = useColorModeValue('blue.600', 'blue.400');

    return (
        <HStack spacing={4} align="end">
            <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={disabled}
                resize="none"
                rows={3}
                focusBorderColor="blue.500"
            />
            <Button
                onClick={handleSubmit}
                isDisabled={disabled || !message.trim()}
                bg={buttonBg}
                color="white"
                px={8}
                h={12}
                _hover={{
                    bg: buttonHoverBg
                }}
                _disabled={{
                    bg: 'gray.300',
                    cursor: 'not-allowed'
                }}
            >
                Send
            </Button>
        </HStack>
    );
}

export default ChatInput; 