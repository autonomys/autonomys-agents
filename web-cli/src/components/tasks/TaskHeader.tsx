import React from 'react';
import { Heading, Flex } from '@chakra-ui/react';
import ConnectionStatusIndicator from '../ConnectionStatus';
import { ConnectionStatus } from '../../services/TaskStreamService';

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
    <Flex
      justifyContent='space-between'
      alignItems='center'
      p={4}
      borderBottom='1px solid'
      borderColor='gray.600'
      bg='rgba(26, 26, 46, 0.8)'
      backdropFilter='blur(8px)'
      position='relative'
      overflow='hidden'
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        bgGradient: 'linear(to-r, transparent, brand.neonBlue, transparent)',
      }}
    >
      <Heading
        as='h3'
        size='md'
        color='brand.neonGreen'
        textShadow='0 0 5px rgba(0, 255, 153, 0.5)'
        fontSize={['md', 'lg', 'xl']}
      >
        Scheduled Tasks
      </Heading>
      <ConnectionStatusIndicator
        connectionStatus={connectionStatus}
        connectionStatusInfo={connectionStatusInfo}
        handleReconnect={handleReconnect}
      />
    </Flex>
  );
};

export default TaskHeader;
