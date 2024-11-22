import { useState, KeyboardEvent } from 'react';
import {
    Button,
    Textarea,
    HStack,
} from '@chakra-ui/react';
import { FiSend } from 'react-icons/fi';
import { styles } from '../styles/ChatInput.styles';

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

    return (
        <HStack spacing={3} px={4} py={3}>
            <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyUp={handleKeyPress}
                placeholder="Type your message..."
                disabled={disabled}
                resize="none"
                rows={1}
                minH="50px"
                maxH="120px"
                {...styles.textarea}
            />
            <Button
                onClick={handleSubmit}
                isDisabled={disabled || !message.trim()}
                {...styles.sendButton}
            >
                <FiSend size={20} />
            </Button>
        </HStack>
    );
}

export default ChatInput; 