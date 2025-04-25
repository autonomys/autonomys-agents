import React from 'react';
import { Heading, Flex } from '@chakra-ui/react';
import ConnectionStatusIndicator from '../ConnectionStatus';
import { ConnectionStatus } from '../../services/TaskStreamService';
import { headerContainerStyles, headingStyles } from './styles/TaskHeaderStyles';

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
    <Flex {...headerContainerStyles}>
      <Heading {...headingStyles}>Tasks</Heading>
      <ConnectionStatusIndicator
        connectionStatus={connectionStatus}
        connectionStatusInfo={connectionStatusInfo}
        handleReconnect={handleReconnect}
      />
    </Flex>
  );
};

export default TaskHeader;
