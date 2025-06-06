import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, Task } from '../types/types';

const initialState: AppState = {
  value: '',
  scheduledTasks: [],
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<ActionType>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

type ActionType =
  | { type: 'SET_VALUE'; payload: string }
  | { type: 'ADD_SCHEDULED_TASK'; payload: Task }
  | { type: 'REMOVE_SCHEDULED_TASK'; payload: string }
  | { type: 'CLEAR_VALUE' };

const appReducer = (state: AppState, action: ActionType): AppState => {
  switch (action.type) {
    case 'SET_VALUE':
      return { ...state, value: action.payload };
    case 'ADD_SCHEDULED_TASK':
      return {
        ...state,
        scheduledTasks: [...state.scheduledTasks, action.payload],
      };
    case 'REMOVE_SCHEDULED_TASK':
      return {
        ...state,
        scheduledTasks: state.scheduledTasks.filter(task => task.id !== action.payload),
      };
    case 'CLEAR_VALUE':
      return { ...state, value: '' };
    default:
      return state;
  }
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
