import React from 'react';
import { ScheduledTasksBoxProps } from '../../types/types';
import './BodyStyles.css';

const ScheduledTasksBox: React.FC<ScheduledTasksBoxProps> = ({ tasks, onDeleteTask }) => {
  return (
    <div className='scheduled-tasks-box'>
      <h3>Scheduled Tasks</h3>
      <div className='tasks-list'>
        {tasks.length === 0 ? (
          <div className='no-tasks'>No scheduled tasks</div>
        ) : (
          <ul>
            {tasks.map((task, index) => (
              <li key={index} className='task-item'>
                <div className='task-time'>{task.time.toISOString()}</div>
                <div className='task-description'>{task.description}</div>
                <button
                  className='delete-task-button'
                  onClick={() => onDeleteTask(index)}
                  title='Delete task'
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ScheduledTasksBox;
