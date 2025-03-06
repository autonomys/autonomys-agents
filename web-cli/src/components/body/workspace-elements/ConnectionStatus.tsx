import React from 'react';
import { ConnectionStatus } from '../../../services/TaskStreamService';
import '../styles/BodyStyles.css';

interface ConnectionStatusProps {
  connectionStatus: ConnectionStatus;
  connectionStatusInfo: {
    message: string;
    className: string;
  };
  handleReconnect: () => void;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusProps> = ({
  connectionStatus,
  connectionStatusInfo,
  handleReconnect,
}) => {
  return (
    <div className={`connection-status ${connectionStatusInfo.className}`}>
      {connectionStatusInfo.message}
      {(connectionStatus === ConnectionStatus.DISCONNECTED ||
        connectionStatus === ConnectionStatus.ERROR) && (
        <button
          className='reconnect-button'
          onClick={handleReconnect}
          title='Reconnect to task stream'
        >
          Reconnect
        </button>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;
