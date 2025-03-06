import React from 'react';
import StatusBox from './StatusBox';
import InputBox from './InputBox';
import ScheduledTasksBox from './ScheduledTasksBox';
import { useAppContext } from '../../context/AppContext';
import './styles/BodyStyles.css';

const BodyArea: React.FC = () => {
  const { state, dispatch } = useAppContext();

  const handleInputChange = (value: string) => {
    dispatch({ type: 'SET_VALUE', payload: value });
  };

  const handleInputSubmit = () => {
    if (state.value.trim() && !state.isProcessing) {
      dispatch({ type: 'SET_PROCESSING', payload: true });

      console.log('Processing input:', state.value);

      dispatch({ type: 'CLEAR_VALUE' });

      setTimeout(() => {
        dispatch({ type: 'SET_PROCESSING', payload: false });
      }, 2000);
    }
  };

  const handleDeleteTask = (index: number) => {
    dispatch({ type: 'REMOVE_SCHEDULED_TASK', payload: index });
  };

  return (
    <div className='body-area'>
      <div className='body-left-section'>
        <StatusBox status={state.isProcessing ? 'Processing...' : 'Ready'} />
        <InputBox
          value={state.value}
          onChange={handleInputChange}
          onSubmit={handleInputSubmit}
          disabled={state.isProcessing}
        />
      </div>
      <div className='body-right-section'>
        <ScheduledTasksBox tasks={state.scheduledTasks} onDeleteTask={handleDeleteTask} />
      </div>
    </div>
  );
};

export default BodyArea;
