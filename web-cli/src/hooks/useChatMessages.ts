import { useState, useEffect, useRef, useCallback } from 'react';
import {
  subscribeToChatMessages,
  sendChatMessage as sendChatMessageApi,
  ChatMessage,
} from '../services/ChatService';
import { useChatContext } from '../context/ChatContext';

export const useChatMessages = (namespace: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');

  const { state, dispatch } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoading(true);

        const contextMessages = state.messages[namespace];

        if (contextMessages && contextMessages.length > 0) {
          setMessages(contextMessages);
        } else {
          const welcomeMessage = {
            id: '1',
            sender: 'agent' as 'agent',
            content: `Hello! I'm the agent for namespace "${namespace}". How can I help you today?`,
            timestamp: new Date(),
          };

          setMessages([welcomeMessage]);

          dispatch({
            type: 'ADD_MESSAGE',
            payload: { namespace, message: welcomeMessage },
          });
        }
      } catch (error) {
        console.error('Error loading chat history:', error);

        const welcomeMessage = {
          id: '1',
          sender: 'agent' as 'agent',
          content: `Hello! I'm the agent for namespace "${namespace}". How can I help you today?`,
          timestamp: new Date(),
        };

        setMessages([welcomeMessage]);

        dispatch({
          type: 'ADD_MESSAGE',
          payload: { namespace, message: welcomeMessage },
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadChatHistory();
  }, [namespace, dispatch, state.messages]);

  useEffect(() => {
    const unsubscribe = subscribeToChatMessages(namespace, message => {
      setMessages(prevMessages => [...prevMessages, message]);

      dispatch({
        type: 'ADD_MESSAGE',
        payload: { namespace, message },
      });

      setIsTyping(false);
    });

    return () => {
      unsubscribe();
    };
  }, [namespace, dispatch]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    if (inputValue.trim() === '' || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);

    dispatch({
      type: 'ADD_MESSAGE',
      payload: { namespace, message: userMessage },
    });

    const currentInputValue = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      await sendChatMessageApi(namespace, currentInputValue);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    }
  };

  return {
    messages,
    isLoading,
    isTyping,
    inputValue,
    setInputValue,
    messagesEndRef,
    sendMessage,
    scrollToBottom,
  };
};
