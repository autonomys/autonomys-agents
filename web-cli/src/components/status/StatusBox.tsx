import React from 'react';
import { StatusBoxProps } from '../../types/types';
import '../styles/BodyStyles.css';

const StatusBox: React.FC<StatusBoxProps> = ({ status }) => {
  console.log('Status:', status);
  const getStatusClass = () => {
    if (status.startsWith('Running:') || status.startsWith('Processing:')) {
      return 'status-running';
    } else if (status === 'Ready') {
      return 'status-ready';
    } else if (status.startsWith('Error:')) {
      return 'status-error';
    } else {
      return '';
    }
  };

  const getStatusLabel = () => {
    if (status.includes(':')) {
      return status.split(':')[0];
    }
    return status;
  };

  const getStatusMessage = () => {
    if (status.includes(':')) {
      return status.substring(status.indexOf(':') + 1).trim();
    }
    return '';
  };

  const statusClass = getStatusClass();
  const statusLabel = getStatusLabel();
  const statusMessage = getStatusMessage();

  return (
    <div className='status-box'>
      <h3>Status</h3>
      <div className={`status-content ${statusClass}`}>
        {status === 'Ready' ? (
          'Ready for input'
        ) : (
          <>
            <div className='status-label'>
              <span className='status-dot'></span>
              {statusLabel}
            </div>
            {statusMessage && <div className='status-message'>{statusMessage}</div>}
          </>
        )}
      </div>
    </div>
  );
};

export default StatusBox;
