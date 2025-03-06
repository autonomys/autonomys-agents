import React from 'react';
import ConnectionStatusIndicator from './ConnectionStatus';
import { ConnectionStatus } from '../../../services/TaskStreamService';
import '../styles/BodyStyles.css';

interface TaskHeaderProps {
  connectionStatus: ConnectionStatus;
  connectionStatusInfo: {
    message: string;
    className: string;
  };
  handleReconnect: () => void;
}

const TaskHeader: React.FC<TaskHeaderProps> = ({
  connectionStatus,
  connectionStatusInfo,
  handleReconnect,
}) => {
  return (
    <div className='task-header'>
      <h3>Scheduled Tasks</h3>
      <ConnectionStatusIndicator
        connectionStatus={connectionStatus}
        connectionStatusInfo={connectionStatusInfo}
        handleReconnect={handleReconnect}
      />
    </div>
  );
};

export default TaskHeader;
