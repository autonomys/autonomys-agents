import React from 'react';
import { StatusBoxProps } from '../../types/types';
import './styles/BodyStyles.css';

const StatusBox: React.FC<StatusBoxProps> = ({ status }) => {
  return (
    <div className='status-box'>
      <h3>Status</h3>
      {status.startsWith('Running:') ? (
        <div className='status-content status-running'>
          <div className='status-label'>Running Task</div>
          <div className='status-message'>{status.substring(9)}</div>
        </div>
      ) : status === 'Ready' ? (
        <div className='status-content status-ready'>Ready for input</div>
      ) : status.startsWith('Error:') ? (
        <div className='status-content status-error'>
          <div className='status-label'>Error</div>
          <div className='status-message'>{status.substring(7)}</div>
        </div>
      ) : (
        <div className='status-content'>{status}</div>
      )}
    </div>
  );
};

export default StatusBox;
