import React from 'react';
import { ScheduledTasksBoxProps } from '../../types/types';
import './styles/BodyStyles.css';

const ScheduledTasksBox: React.FC<ScheduledTasksBoxProps> = ({ tasks, onDeleteTask }) => {
  // Function to get the appropriate status class
  const getStatusClass = (status?: string) => {
    if (!status) return 'status-ready';
    
    switch(status.toLowerCase()) {
      case 'processing':
        return 'status-running';
      case 'completed':
        return 'status-completed';
      case 'failed':
        return 'status-error';
      default:
        return 'status-ready';
    }
  };

  // Format the time in a more readable way
  const formatTime = (time: Date) => {
    return time.toISOString().replace('T', ' ').substring(0, 19);
  };

  return (
    <div className='scheduled-tasks-box'>
      <div className='tasks-list'>
        {tasks.length === 0 ? (
          <div className='no-tasks'>No scheduled tasks</div>
        ) : (
          <ul>
            {tasks.map(task => (
              <li key={task.id} className='task-item'>
                <div className='task-time'>{formatTime(task.time)}</div>
                <div className='task-description'>{task.description}</div>
                <div className='task-status-container'>
                  {task.status && (
                    <span className={`task-status ${getStatusClass(task.status)}`}>
                      {task.status}
                    </span>
                  )}
                  <button
                    className='delete-task-button'
                    onClick={() => onDeleteTask(task.id)}
                    title='Delete task'
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ScheduledTasksBox;
