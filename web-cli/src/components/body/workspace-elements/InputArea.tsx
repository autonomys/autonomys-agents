import React from 'react';
import StatusBox from '../StatusBox';
import InputBox from '../InputBox';
import { ScheduledTask } from '../../../types/types';
import '../styles/BodyStyles.css';

interface InputAreaProps {
  value: string;
  isProcessing: boolean;
  handleInputChange: (value: string) => void;
  handleInputSubmit: () => void;
  currentTask?: ScheduledTask;
  error?: string;
}

const InputArea: React.FC<InputAreaProps> = ({
  value,
  isProcessing,
  handleInputChange,
  handleInputSubmit,
  currentTask,
  error,
}) => {
  // Determine the status text based on current task status
  const getStatusText = () => {
    if (currentTask) {
      // If the current task has a status, use it; otherwise show as "Running"
      const taskStatus = currentTask.status || 'processing';
      
      // Capitalize the first letter of the status
      const formattedStatus = taskStatus.charAt(0).toUpperCase() + taskStatus.slice(1);
      
      return `${formattedStatus}: ${currentTask.description}`;
    } else if (error) {
      return `Error: ${error}`;
    } else {
      return 'Ready';
    }
  };

  return (
    <div className='body-left-section'>
      <StatusBox status={getStatusText()} />
      <InputBox
        value={value}
        onChange={handleInputChange}
        onSubmit={handleInputSubmit}
      />
    </div>
  );
};

export default InputArea;
