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
}

const InputArea: React.FC<InputAreaProps> = ({
  value,
  isProcessing,
  handleInputChange,
  handleInputSubmit,
  currentTask,
}) => {
  // Determine the status text based on processing state and current task
  const getStatusText = () => {
    if (isProcessing) {
      return 'Processing...';
    } else if (currentTask) {
      return `Running: ${currentTask.description}`;
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
        disabled={isProcessing}
      />
    </div>
  );
};

export default InputArea;
