import React, { createContext, useContext, useReducer, ReactNode } from 'react';

type ActionType =
  | { type: 'SET_ACTIVE_CHAT'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: { namespace: string; message: Message } }
  | { type: 'CLEAR_CHAT'; payload: string };

interface Message {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

interface ChatState {
  activeChatNamespace: string | null;
  messages: Record<string, Message[]>;
}

interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ActionType>;
}

interface ChatProviderProps {
  children: ReactNode;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const loadStateFromStorage = (): ChatState => {
  try {
    const storedData = localStorage.getItem('chatState');
    if (!storedData) return { activeChatNamespace: null, messages: {} };

    const parsedData = JSON.parse(storedData);

    const messagesWithDateObjects: Record<string, Message[]> = {};
    Object.keys(parsedData.messages).forEach(namespace => {
      messagesWithDateObjects[namespace] = parsedData.messages[namespace].map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    });

    return {
      activeChatNamespace: parsedData.activeChatNamespace,
      messages: messagesWithDateObjects,
    };
  } catch (error) {
    console.error('Error loading chat state from storage:', error);
    return { activeChatNamespace: null, messages: {} };
  }
};

const initialState: ChatState = loadStateFromStorage();

const chatReducer = (state: ChatState, action: ActionType): ChatState => {
  let newState: ChatState;

  switch (action.type) {
    case 'SET_ACTIVE_CHAT':
      newState = {
        ...state,
        activeChatNamespace: action.payload,
        messages: {
          ...state.messages,
          ...(action.payload && !state.messages[action.payload]
            ? {
                [action.payload]: [
                  {
                    id: Date.now().toString(),
                    sender: 'agent',
                    content: `Hello! I'm the agent for namespace "${action.payload}". How can I help you today?`,
                    timestamp: new Date(),
                  },
                ],
              }
            : {}),
        },
      };
      break;
    case 'ADD_MESSAGE': {
      const { namespace, message } = action.payload;
      newState = {
        ...state,
        messages: {
          ...state.messages,
          [namespace]: [...(state.messages[namespace] || []), message],
        },
      };
      break;
    }
    case 'CLEAR_CHAT':
      newState = {
        ...state,
        messages: {
          ...state.messages,
          [action.payload]: [],
        },
      };
      break;
    default:
      return state;
  }

  saveStateToStorage(newState);
  return newState;
};

const saveStateToStorage = (state: ChatState) => {
  try {
    localStorage.setItem('chatState', JSON.stringify(state));
  } catch (error) {
    console.error('Error saving chat state to storage:', error);
  }
};

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  return <ChatContext.Provider value={{ state, dispatch }}>{children}</ChatContext.Provider>;
};

export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
