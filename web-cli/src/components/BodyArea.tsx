import React from 'react';
import { Flex, Box } from '@chakra-ui/react';
import { useTaskManager } from '../hooks/useBodyLeftSide';
import InputArea from './input/InputArea';
import TasksArea from './tasks/TasksArea';
import ChatArea from './chat/ChatArea';
import StatusBox from './status/StatusBox';
import TabNavigation from './tabs/TabNavigation';

const BodyArea: React.FC = () => {
  const {
    state,
    chatState,
    loading,
    tabIndex,
    connectionStatus,
    handleTabChange,
    getStatusText,
    handleStopWorkflow,
    handleInputChange,
    handleInputSubmit,
    handleDeleteTask,
    handleReconnect,
    handleCloseChat,
    connectionStatusInfo,
    allTasks,
  } = useTaskManager();

  const tabs = [
    { id: 0, label: 'Agent' },
    { id: 1, label: 'Chat' }
  ];

  return (
    <Flex className='left-panel' direction='column' position='relative' height='100%' pb={0}>
      <TabNavigation 
        activeTabIndex={tabIndex}
        onTabChange={handleTabChange}
        tabs={tabs}
      />
      
      {chatState.activeChatNamespace ? (
        <Box flex='1' mb={0}>
          <ChatArea namespace={chatState.activeChatNamespace} onClose={handleCloseChat} />
        </Box>
      ) : (
        <>
          <StatusBox status={getStatusText()} onStop={handleStopWorkflow} />

          <Box flex='0 0 auto' mb={2}>
            <InputArea
              value={state.value}
              handleInputChange={handleInputChange}
              handleInputSubmit={handleInputSubmit}
              showChat={chatState.activeChatNamespace !== null}
              onCloseChatRequest={handleCloseChat}
            />
          </Box>
          <Box flex='1' mb={2}>
            <TasksArea
              tasks={allTasks}
              loading={loading}
              connectionStatus={connectionStatus}
              connectionStatusInfo={connectionStatusInfo}
              handleDeleteTask={handleDeleteTask}
              handleReconnect={handleReconnect}
            />
          </Box>
        </>
      )}
    </Flex>
  );
};

export default BodyArea;
